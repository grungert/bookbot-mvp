import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

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

// Get company services for context
async function getCompanyServices(companyId: string): Promise<string> {
  const services = await prisma.service.findMany({
    where: { companyId, isActive: true },
    select: {
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
        `- ${s.name}: ${s.description || "No description"} (${s.duration} min, ${s.currency} ${s.price})`
    )
    .join("\n");
}

// Build system prompt with context
async function buildSystemPrompt(
  companyId: string,
  customPrompt?: string
): Promise<string> {
  const [documents, services] = await Promise.all([
    getCompanyDocuments(companyId),
    getCompanyServices(companyId),
  ]);

  const basePrompt = `You are a helpful customer service assistant for a booking platform.
Your role is to help customers with their questions, provide information about services, and assist with booking appointments.

Available Services:
${services}

${documents ? `\nKnowledge Base:\n${documents}\n` : ""}

Guidelines:
- Be friendly, professional, and concise
- If asked about booking, provide information about available services
- If asked about specific availability, suggest checking the booking page
- If you don't know something, say so honestly
- Keep responses brief but helpful`;

  if (customPrompt) {
    return `${customPrompt}\n\n${basePrompt}`;
  }

  return basePrompt;
}

// Main chat function
export async function chat(
  companyId: string,
  config: ChatConfig,
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const client = createClient(config);
  const systemPrompt = await buildSystemPrompt(companyId, config.systemPrompt);

  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
    { role: "user", content: userMessage },
  ];

  try {
    const completion = await client.chat.completions.create({
      model: config.model || "gpt-3.5-turbo",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    throw new Error("Failed to generate response");
  }
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
