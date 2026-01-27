import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { getPersonalityPrompt } from "./personalities";
import { TOOL_INSTRUCTIONS, type ToolParams } from "./tools";
import { executeToolAction, type ToolContext, type ToolResult } from "./tool-handlers";
import { createRichMessageContent } from "@/components/chat/message-parser";
import { estimateTokens } from "@/lib/document-tokens";
import type { BookingState } from "./booking-flow";
import { getTranslator } from "@/lib/i18n/backend";
import { getDateLocale } from "@/lib/i18n/date-locale";

export interface ChatResult {
  response: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
  systemPrompt?: string;
}

// Company context with personality settings
export interface CompanyContext {
  id: string;
  slug: string;
  name: string;
  botName?: string | null;
  greeting?: string | null;
  personality?: string | null;
  language?: string | null;
}

// User context for personalization
export interface UserContext {
  id: string;
  email: string;
  name?: string | null;
}

// Maximum tool loop iterations to prevent infinite loops
const MAX_TOOL_ITERATIONS = 8;

// Maximum chat history messages to include (to avoid token limits)
// This keeps the last N messages (user + assistant pairs)
export const MAX_CHAT_HISTORY_MESSAGES = 20;

// Create OpenAI client with custom config
function createClient(config: ChatConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.endpoint || undefined,
  });
}

// Get company documents for context
async function getCompanyDocuments(companyId: string): Promise<string> {
  const documents = await prisma.document.findMany({
    where: { companyId },
    select: {
      title: true,
      content: true,
    },
  });

  if (documents.length === 0) {
    return "";
  }

  return documents
    .map((doc) => `## ${doc.title}\n${doc.content}`)
    .join("\n\n---\n\n");
}

// Get company services for context (with IDs for tool calling)
async function getCompanyServices(companyId: string): Promise<string> {
  const services = await prisma.service.findMany({
    where: { companyId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      currency: true,
    },
  });

  if (services.length === 0) {
    return "No services available.";
  }

  return services
    .map(
      (s) =>
        `- ${s.name} (ID: ${s.id}): ${s.description || "No description"} | ${s.duration} min | ${s.currency} ${s.price}`
    )
    .join("\n");
}

// Get user's upcoming appointments (next 7 days, max 5)
async function getUserUpcomingAppointments(
  companyId: string,
  userId: string,
  language?: string | null
): Promise<string> {
  const now = new Date();
  const weekFromNow = addDays(now, 7);
  const dateLocale = getDateLocale(language);

  const appointments = await prisma.appointment.findMany({
    where: {
      companyId,
      userId,
      startTime: {
        gte: startOfDay(now),
        lte: endOfDay(weekFromNow),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  if (appointments.length === 0) {
    return "No upcoming appointments.";
  }

  return appointments
    .map(
      (a) =>
        `- [ID: ${a.id.slice(-8)}] ${format(a.startTime, "EEEE, MMM d", { locale: dateLocale })} at ${format(a.startTime, "HH:mm")} - ${a.service.name} (${a.status})`
    )
    .join("\n");
}

// Get user's recent appointment history (last 5)
async function getUserRecentAppointments(
  companyId: string,
  userId: string,
  language?: string | null
): Promise<string> {
  const dateLocale = getDateLocale(language);
  const appointments = await prisma.appointment.findMany({
    where: {
      companyId,
      userId,
      startTime: { lt: new Date() },
    },
    include: { service: true },
    orderBy: { startTime: "desc" },
    take: 5,
  });

  if (appointments.length === 0) {
    return "No past appointments.";
  }

  return appointments
    .map(
      (a) =>
        `- ${format(a.startTime, "MMM d, yyyy", { locale: dateLocale })} - ${a.service.name} (${a.status})`
    )
    .join("\n");
}

// Build enhanced system prompt with context
async function buildSystemPrompt(
  company: CompanyContext,
  user: UserContext | null,
  customPrompt?: string
): Promise<string> {
  const [documents, services] = await Promise.all([
    getCompanyDocuments(company.id),
    getCompanyServices(company.id),
  ]);

  // Get user appointments if logged in
  let upcomingAppointments = "";
  let recentAppointments = "";
  if (user) {
    [upcomingAppointments, recentAppointments] = await Promise.all([
      getUserUpcomingAppointments(company.id, user.id, company.language),
      getUserRecentAppointments(company.id, user.id, company.language),
    ]);
  }

  const botName = company.botName || "Assistant";
  const personalityPrompt = getPersonalityPrompt(company.personality);
  const dateLocale = getDateLocale(company.language);
  const now = new Date();
  const today = format(now, "EEEE, MMMM d, yyyy", { locale: dateLocale });
  const currentTime = format(now, "HH:mm");

  // Language instruction for non-English languages
  const language = company.language || "en";
  const t = getTranslator(language);
  const languageNames: Record<string, string> = { en: "English", sr: "Serbian" };
  const languageName = languageNames[language] || "English";
  const languageInstruction = language !== "en"
    ? `${t("botChat.languageInstruction", { languageName })}\n\n`
    : "";

  let prompt = `${languageInstruction}You are ${botName}, a booking assistant for ${company.name}.

YOUR IDENTITY:
- Name: ${botName}
- ${personalityPrompt}
${company.greeting ? `- Default greeting: "${company.greeting}"` : ""}

CURRENT DATE AND TIME: ${today}, ${currentTime}

AVAILABLE SERVICES:
${services}

`;

  // Add user context if logged in
  if (user) {
    prompt += `CURRENT USER:
- Name: ${user.name || "Unknown"}
- Email: ${user.email}

UPCOMING APPOINTMENTS (Next 7 days):
${upcomingAppointments}

RECENT APPOINTMENT HISTORY:
${recentAppointments}

`;
  } else {
    prompt += `CURRENT USER: Guest (not logged in)
- For guest bookings, collect name and email before creating a booking.

`;
  }

  // Add tool instructions
  prompt += TOOL_INSTRUCTIONS;

  // Add booking rules
  prompt += `

BOOKING RULES:
1. ALWAYS confirm booking details with the user BEFORE calling createBooking
2. For guests, collect name and email first
3. Check upcoming appointments before booking to avoid conflicts
4. Use getAvailableSlots to check times before suggesting availability
5. Be helpful and guide users through the booking process
6. NEVER show internal IDs (service IDs, booking IDs, session IDs, or any system identifiers) to the user. Only use human-readable names, dates, and times in your responses
7. Users must be identified to cancel or reschedule. On web chat they must be logged in. On WhatsApp they are identified by phone number.
8. Use requestConfirmation to show confirmation buttons before cancelling or rescheduling. The system executes the action automatically when the user clicks confirm. Do NOT ask for confirmation again after showing buttons.
9. For rescheduling, show available time slots first using getAvailableSlots, then use requestConfirmation with the rescheduleAppointment action.
10. Use the appointment IDs from UPCOMING APPOINTMENTS or searchAppointments results.`;

  // Add knowledge base if available
  if (documents) {
    prompt += `

KNOWLEDGE BASE:
${documents}`;
  }

  // Add custom prompt if provided
  if (customPrompt) {
    prompt += `

ADDITIONAL INSTRUCTIONS:
${customPrompt}`;
  }

  return prompt;
}

// Clean malformed JSON (trailing commas, etc.)
function cleanJSON(jsonStr: string): string {
  return jsonStr
    .replace(/,\s*}/g, "}") // Remove trailing commas before }
    .replace(/,\s*]/g, "]"); // Remove trailing commas before ]
}

// Parse action block from response
// Supports multiple formats: <action>...</action>, ```action {...} ```, and special model tokens
function parseAction(response: string): ToolParams | null {
  // Try XML-style tags first
  let match = response.match(/<action>([\s\S]*?)<\/action>/);

  // Try markdown code block format: ```action {...} ```
  if (!match) {
    match = response.match(/```action\s*([\s\S]*?)```/);
  }

  // Try plain JSON block that looks like a tool call
  if (!match) {
    match = response.match(/```(?:json)?\s*(\{[\s\S]*?"tool"[\s\S]*?\})```/);
  }

  // Try special model token format: <|channel|>...{"tool":...}
  if (!match) {
    match = response.match(/<\|channel\|>[\s\S]*?<\|message\|>\s*(\{[\s\S]*?"tool"[\s\S]*?\})/);
  }

  // Try to find any JSON object with "tool" key as last resort
  if (!match) {
    match = response.match(/(\{"tool"\s*:\s*"[^"]+?"[^}]*\})/);
  }

  if (!match) return null;

  try {
    // Clean malformed JSON before parsing
    const cleanedJSON = cleanJSON(match[1].trim());
    const parsed = JSON.parse(cleanedJSON);
    if (typeof parsed === "object" && parsed.tool) {
      return parsed as ToolParams;
    }
    return null;
  } catch {
    return null;
  }
}

// Remove action block from response for display
function removeActionBlock(response: string): string {
  return response
    .replace(/<action>[\s\S]*?<\/action>/g, "")
    .replace(/```action\s*[\s\S]*?```/g, "")
    .replace(/```(?:json)?\s*\{[\s\S]*?"tool"[\s\S]*?\}```/g, "")
    // Remove special model token format
    .replace(/<\|channel\|>[\s\S]*?<\|message\|>\s*\{[\s\S]*?"tool"[\s\S]*?\}/g, "")
    // Remove any standalone JSON tool objects
    .replace(/\{"tool"\s*:\s*"[^"]+?"[^}]*\}/g, "")
    .trim();
}

// Extract plain text from potentially nested JSON response
// The LLM sometimes outputs JSON format when it shouldn't - this cleans it up
function extractPlainText(response: string): string {
  const trimmed = response.trim();

  // If it doesn't look like JSON, return as-is
  if (!trimmed.startsWith("{")) {
    return response;
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Check if it's a rich message structure
    if (parsed && typeof parsed === "object" && parsed.type === "rich" && typeof parsed.text === "string") {
      // Recursively extract text in case it's also JSON
      return extractPlainText(parsed.text);
    }

    // If it's JSON but not a rich message, return as-is
    return response;
  } catch {
    // Not valid JSON, return as-is
    return response;
  }
}

// Main chat function with tool execution loop
export async function chat(
  company: CompanyContext,
  config: ChatConfig,
  messages: ChatMessage[],
  userMessage: string,
  user: UserContext | null,
  sessionId: string,
  bookingState?: BookingState | null,
  channel?: string
): Promise<ChatResult> {
  const client = createClient(config);
  let systemPrompt = await buildSystemPrompt(company, user, config.systemPrompt);

  // Inject booking state context when active
  if (bookingState?.active) {
    systemPrompt += `

ACTIVE BOOKING STATE:
${JSON.stringify(bookingState, null, 2)}

The user is currently in the booking flow at step "${bookingState.step}".
${bookingState.serviceId ? `Selected service: ${bookingState.serviceName} (ID: ${bookingState.serviceId})` : "No service selected yet."}
${bookingState.date ? `Selected date: ${bookingState.date}` : ""}

IMPORTANT - When the user mentions booking details in text (e.g. "eye exam on January 18" or "tomorrow"):
- Use the updateBookingState tool to set the extracted fields (serviceId, serviceName, date)
- The system will automatically show the next step UI
- Example: User says "eye exam on January 18" → <action>{"tool": "updateBookingState", "serviceId": "ID_OF_EYE_EXAM", "serviceName": "Eye Exam", "date": "2026-01-18"}</action>
- Example: User says "tomorrow" during date step → <action>{"tool": "updateBookingState", "date": "YYYY-MM-DD"}</action>
- Match service names to their IDs from the AVAILABLE SERVICES list above`;
  }

  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
    { role: "user", content: userMessage },
  ];

  // Tool context for executing actions
  const toolContext: ToolContext = {
    companyId: company.id,
    companyName: company.name,
    companySlug: company.slug,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name || undefined,
    sessionId,
    language: company.language || "en",
    channel,
  };

  let iterations = 0;
  let lastToolResult: ToolResult | null = null;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    try {
      const completion = await client.chat.completions.create({
        model: config.model || "gpt-3.5-turbo",
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || "";

      // Accumulate token usage
      totalInputTokens += completion.usage?.prompt_tokens ?? estimateTokens(allMessages.map(m => m.content).join(''));
      totalOutputTokens += completion.usage?.completion_tokens ?? estimateTokens(response);

      // Check for action block
      const action = parseAction(response);

      if (!action) {
        // Check if the LLM mentioned showing UI but forgot the action block
        const mentionsUI = /calendar|date picker|available dates|time slots|available times|service list|services/i.test(response);
        const mentionsShowing = /let me show|here('s| are)|showing|pull up|display/i.test(response);

        if (mentionsUI && mentionsShowing && iterations < MAX_TOOL_ITERATIONS) {
          // LLM forgot the action block - remind it
          allMessages.push({ role: "assistant", content: response });
          allMessages.push({
            role: "user",
            content: `ERROR: You mentioned showing UI (calendar/dates/times/services) but did NOT include an <action> block. The UI will NOT appear without an action block. You MUST include the <action> block in your response. Please try again with the correct action block.`,
          });
          continue;
        }

        // No action - return the response (with UI if available from last tool)
        // Always clean the response - remove any JSON wrapper and action blocks the LLM may have added
        const cleanResponse = removeActionBlock(extractPlainText(response));

        const usage = { inputTokens: totalInputTokens, outputTokens: totalOutputTokens, totalTokens: totalInputTokens + totalOutputTokens };

        if (lastToolResult?.ui) {
          return { response: createRichMessageContent(cleanResponse, lastToolResult.ui), usage };
        }
        return { response: cleanResponse, usage };
      }

      // Execute the tool
      const result = await executeToolAction(toolContext, action);
      lastToolResult = result;

      // Add assistant message and tool result to context
      allMessages.push({ role: "assistant", content: response });

      // Format tool result with clear next-step instructions
      let resultMessage = `<tool_result>
Tool: ${action.tool}
Success: ${result.success}
Result: ${result.userMessage}
</tool_result>`;

      // Add next step hints based on the tool that was called
      if (result.success && result.ui) {
        switch (action.tool) {
          case "getServices":
            resultMessage += `\n\nThe service selector UI is now displayed. Wait for the user to select a service. When they do, they will say something like "I'd like to book [Service Name]". Then you MUST call getDatePicker with that service's ID.`;
            break;
          case "getDatePicker":
            resultMessage += `\n\nThe calendar UI is now displayed. Wait for the user to select a date. When they do, they will say something like "I'd like to book on [Date]". Then you MUST call getAvailableSlots with the serviceId and date.`;
            break;
          case "getAvailableSlots":
            resultMessage += `\n\nThe time slots UI is now displayed. Wait for the user to select a time. When they do, they will say something like "I'd like the [Time] slot". Then you MUST call createBooking.`;
            break;
          case "createBooking":
            resultMessage += `\n\nThe booking has been created and confirmation card is displayed. Thank the user and ask if they need anything else.`;
            break;
          case "updateBookingState":
            resultMessage += `\n\nThe booking state has been updated and the appropriate UI is displayed. Acknowledge what was set and wait for the user's next selection.`;
            break;
          case "cancelAppointment":
            resultMessage += `\n\nThe appointment has been cancelled and the updated card is displayed. Acknowledge the cancellation and ask if they need anything else.`;
            break;
          case "rescheduleAppointment":
            resultMessage += `\n\nThe appointment has been rescheduled and the updated card is displayed. Confirm the new date/time and ask if they need anything else.`;
            break;
          case "requestConfirmation":
            resultMessage += `\n\nConfirmation buttons are displayed. Wait for the user to click. The confirm action will execute automatically when clicked. Do NOT ask for confirmation again.`;
            break;
        }
      }

      allMessages.push({
        role: "user",
        content: resultMessage,
      });

      // Continue loop to get next response
    } catch (error) {
      console.error("Chat error:", error);
      throw new Error("Failed to generate response");
    }
  }

  // Max iterations reached - return last response or error
  const t = getTranslator(company.language);
  return {
    response: t("botChat.maxIterationsError"),
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens, totalTokens: totalInputTokens + totalOutputTokens },
  };
}

// Save chat message to database
export async function saveChatMessage(
  sessionId: string,
  role: string,
  content: string,
  inputTokens?: number,
  outputTokens?: number
) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      inputTokens,
      outputTokens,
    },
  });
}

// Get or create chat session
// For logged-in users: reuse recent session (within 24 hours)
// For guests: always create new session (they use localStorage to track sessionId)
export async function getOrCreateChatSession(
  companyId: string,
  userId?: string
) {
  // For logged-in users, try to find a recent active session
  if (userId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentSession = await prisma.chatSession.findFirst({
      where: {
        companyId,
        userId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentSession) {
      return recentSession;
    }
  }

  // Create a new session for guests or if no recent session found
  return prisma.chatSession.create({
    data: {
      companyId,
      userId,
    },
  });
}

// Get chat history (limited to last N messages to avoid token limits)
export async function getChatHistory(sessionId: string, limit: number = MAX_CHAT_HISTORY_MESSAGES) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" }, // Get newest first
    take: limit,
    select: {
      role: true,
      content: true,
    },
  });

  // Reverse to get chronological order
  return messages.reverse();
}
