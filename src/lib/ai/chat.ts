import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { getPersonalityPrompt } from "./personalities";
import { TOOL_INSTRUCTIONS, type ToolParams } from "./tools";
import { executeToolAction, type ToolContext } from "./tool-handlers";

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
}

// User context for personalization
export interface UserContext {
  id: string;
  email: string;
  name?: string | null;
}

// Maximum tool loop iterations to prevent infinite loops
const MAX_TOOL_ITERATIONS = 5;

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
  userId: string
): Promise<string> {
  const now = new Date();
  const weekFromNow = addDays(now, 7);

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
        `- ${format(a.startTime, "EEEE, MMM d")} at ${format(a.startTime, "HH:mm")} - ${a.service.name} (${a.status})`
    )
    .join("\n");
}

// Get user's recent appointment history (last 5)
async function getUserRecentAppointments(
  companyId: string,
  userId: string
): Promise<string> {
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
        `- ${format(a.startTime, "MMM d, yyyy")} - ${a.service.name} (${a.status})`
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
      getUserUpcomingAppointments(company.id, user.id),
      getUserRecentAppointments(company.id, user.id),
    ]);
  }

  const botName = company.botName || "Assistant";
  const personalityPrompt = getPersonalityPrompt(company.personality);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  let prompt = `You are ${botName}, a booking assistant for ${company.name}.

YOUR IDENTITY:
- Name: ${botName}
- ${personalityPrompt}
${company.greeting ? `- Default greeting: "${company.greeting}"` : ""}

TODAY'S DATE: ${today}

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
5. Be helpful and guide users through the booking process`;

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

// Parse action block from response
function parseAction(response: string): ToolParams | null {
  const match = response.match(/<action>([\s\S]*?)<\/action>/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
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
  return response.replace(/<action>[\s\S]*?<\/action>/g, "").trim();
}

// Main chat function with tool execution loop
export async function chat(
  company: CompanyContext,
  config: ChatConfig,
  messages: ChatMessage[],
  userMessage: string,
  user: UserContext | null,
  sessionId: string
): Promise<string> {
  const client = createClient(config);
  const systemPrompt = await buildSystemPrompt(company, user, config.systemPrompt);

  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
    { role: "user", content: userMessage },
  ];

  // Tool context for executing actions
  const toolContext: ToolContext = {
    companyId: company.id,
    companyName: company.name,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name || undefined,
  };

  let iterations = 0;

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

      // Check for action block
      const action = parseAction(response);

      if (!action) {
        // No action - return the response
        return response;
      }

      // Execute the tool
      const result = await executeToolAction(toolContext, action);

      // Add assistant message and tool result to context
      allMessages.push({ role: "assistant", content: response });
      allMessages.push({
        role: "user",
        content: `<result>${JSON.stringify(result)}</result>`,
      });

      // Continue loop to get next response
    } catch (error) {
      console.error("Chat error:", error);
      throw new Error("Failed to generate response");
    }
  }

  // Max iterations reached - return last response or error
  return "I'm sorry, I encountered an issue processing your request. Please try again.";
}

// Save chat message to database
export async function saveChatMessage(
  sessionId: string,
  role: string,
  content: string
) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
}

// Get or create chat session
export async function getOrCreateChatSession(
  companyId: string,
  userId?: string
) {
  // For simplicity, create a new session each time
  // In production, you might want to reuse sessions
  return prisma.chatSession.create({
    data: {
      companyId,
      userId,
    },
  });
}

// Get chat history
export async function getChatHistory(sessionId: string) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      content: true,
    },
  });
}
