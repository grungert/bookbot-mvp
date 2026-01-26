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
import {
  getCompanyOwnerId,
  checkChatLimit,
  incrementChatUsage,
  checkSubscriptionActive,
} from "@/lib/subscription";
import {
  handleBookingSelection,
  getBookingState,
  type BookingAction,
} from "@/lib/ai/booking-flow";
import type { ToolContext } from "@/lib/ai/tool-handlers";
import { z } from "zod";

const bookingActionSchema = z.object({
  type: z.enum(["service", "date", "time"]),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  date: z.string().optional(),
  dateISO: z.string().optional(),
  time: z.string().optional(),
  startTime: z.string().optional(),
});

const chatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().nullish(), // Allow null, undefined, or string
  bookingAction: bookingActionSchema.optional(),
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

    // Get company owner for subscription checks
    const ownerId = await getCompanyOwnerId(company.id);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Company owner not found" },
        { status: 500 }
      );
    }

    // Check owner's subscription is active
    const subscriptionStatus = await checkSubscriptionActive(ownerId);
    if (!subscriptionStatus.active) {
      return NextResponse.json(
        {
          error: subscriptionStatus.reason || "Subscription not active",
          code:
            subscriptionStatus.status === "TRIAL_EXPIRED"
              ? "TRIAL_EXPIRED"
              : "SUBSCRIPTION_INACTIVE",
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // Check chat limit (at user level, shared across all companies)
    const chatLimitResult = await checkChatLimit(ownerId);
    if (!chatLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Monthly token limit reached across all companies",
          code: "CHAT_LIMIT_EXCEEDED",
          currentUsage: chatLimitResult.currentUsage,
          limit: chatLimitResult.limit,
          resetsAt: chatLimitResult.resetsAt.toISOString(),
          upgradeUrl: "/pricing",
        },
        { status: 429 }
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

    const { message, sessionId: existingSessionId, bookingAction } = parsed.data;

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

    // --- Booking action bypass: handle option clicks directly (no LLM) ---
    if (bookingAction) {
      // Save user message (human-readable text for chat history)
      await saveChatMessage(session.id, "user", message);

      const toolContext: ToolContext = {
        companyId: company.id,
        companyName: company.name,
        userId: currentUser?.id,
        userEmail: currentUser?.email || undefined,
        userName: currentUser?.name || undefined,
        sessionId: session.id,
      };

      const result = await handleBookingSelection(
        toolContext,
        session.id,
        bookingAction as BookingAction
      );

      // Save assistant response (0 tokens - no LLM used)
      await saveChatMessage(session.id, "assistant", result.assistantMessage, 0, 0);

      return NextResponse.json({
        sessionId: session.id,
        message: result.assistantMessage,
      });
    }

    // --- Normal LLM flow ---

    // Get chat history
    const history = await getChatHistory(session.id);
    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Save user message
    await saveChatMessage(session.id, "user", message);

    // Load booking state for LLM context
    const bookingState = await getBookingState(session.id);

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
    const { response, usage } = await chat(
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
      session.id,
      bookingState
    );

    // Save assistant response with token usage
    await saveChatMessage(session.id, "assistant", response, usage.inputTokens, usage.outputTokens);

    // Increment chat usage at user level (owner pays for all company usage)
    await incrementChatUsage(ownerId, 1, usage);

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
