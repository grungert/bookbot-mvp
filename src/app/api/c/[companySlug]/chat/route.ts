import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";
import {
  chat,
  getOrCreateChatSession,
  saveChatMessage,
  getChatHistory,
  type CompanyContext,
  type UserContext,
} from "@/lib/ai/chat";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().nullish(), // Allow null, undefined, or string
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// POST /api/c/[companySlug]/chat
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if company has AI configured
    if (!company.aiApiKey) {
      return NextResponse.json(
        { error: "AI not configured for this company" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId: existingSessionId } = parsed.data;

    // Get or create session
    let session;
    if (existingSessionId) {
      session = await prisma.chatSession.findFirst({
        where: {
          id: existingSessionId,
          companyId: company.id,
        },
      });
    }

    if (!session) {
      session = await getOrCreateChatSession(company.id, currentUser?.id);
    }

    // Get chat history
    const history = await getChatHistory(session.id);
    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Save user message
    await saveChatMessage(session.id, "user", message);

    // Build company context with personality settings
    const companyContext: CompanyContext = {
      id: company.id,
      slug: company.slug,
      name: company.name,
      botName: company.aiBotName,
      greeting: company.aiGreeting,
      personality: company.aiPersonality,
    };

    // Build user context if logged in (only if email is available)
    const userContext: UserContext | null =
      currentUser && currentUser.email
        ? {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
          }
        : null;

    // Generate response with enhanced context
    const response = await chat(
      companyContext,
      {
        apiKey: company.aiApiKey,
        endpoint: company.aiEndpoint || undefined,
        model: company.aiModel || undefined,
        systemPrompt: company.aiSystemPrompt || undefined,
      },
      messages,
      message,
      userContext,
      session.id
    );

    // Save assistant response
    await saveChatMessage(session.id, "assistant", response);

    return NextResponse.json({
      sessionId: session.id,
      message: response,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
