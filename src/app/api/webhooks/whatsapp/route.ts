/**
 * WhatsApp Webhook Handler
 *
 * Handles incoming WhatsApp messages via Meta Cloud API webhook.
 * Processes messages through the AI chat engine and sends responses back.
 *
 * Booking flow optimization: button/list replies with booking IDs
 * (service_xxx, date_xxx, time_xxx) bypass the LLM and are handled
 * directly by the booking state machine.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  whatsappAdapter,
  findOrCreateWhatsAppSession,
  handleWhatsAppStatusUpdate,
  findCompanyByPhoneNumberId,
  sendTypingIndicator,
} from "@/lib/channels/whatsapp";
import {
  chat,
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
  formatForWhatsApp,
  parseWhatsAppSelection,
} from "@/lib/channels/formatter";
import {
  handleBookingSelection,
  getBookingState,
  type BookingAction,
} from "@/lib/ai/booking-flow";
import type { ToolContext } from "@/lib/ai/tool-handlers";
import type { ChatUIComponent, RichMessage } from "@/components/chat/types";
import { getTranslator } from "@/lib/i18n/backend";
import { checkAndNotifyUsageThresholds } from "@/lib/notifications/usage-notifications";

/**
 * GET - Handle webhook verification challenge from Meta
 */
export async function GET(request: Request) {
  return whatsappAdapter.handleVerificationChallenge!(request);
}

/**
 * Extract phone number ID from webhook payload
 */
function extractPhoneNumberIdFromPayload(body: unknown): string | null {
  try {
    const payload = body as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            metadata?: {
              phone_number_id?: string;
            };
          };
        }>;
      }>;
    };
    return payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || null;
  } catch {
    return null;
  }
}

/**
 * Parse rich message content to extract UI components
 */
function parseRichMessage(content: string): { text: string; ui?: ChatUIComponent } {
  try {
    const parsed = JSON.parse(content) as RichMessage;
    if (parsed.type === "rich" && parsed.ui) {
      return { text: parsed.text, ui: parsed.ui };
    }
    return { text: content };
  } catch {
    return { text: content };
  }
}

/**
 * Convert a WhatsApp selection to a BookingAction
 */
function selectionToBookingAction(
  selection: { type: "service" | "date" | "time" | "text"; value: string },
  content: string
): BookingAction | null {
  switch (selection.type) {
    case "service":
      return {
        type: "service",
        serviceId: selection.value,
        serviceName: content, // Button text is the service name
      };
    case "date":
      return {
        type: "date",
        date: selection.value, // YYYY-MM-DD
      };
    case "time":
      return {
        type: "time",
        startTime: selection.value, // ISO datetime
      };
    default:
      return null;
  }
}

/**
 * POST - Handle incoming WhatsApp messages
 */
export async function POST(request: Request) {
  try {
    // Parse the incoming message
    const incomingMessage = await whatsappAdapter.parseIncoming(
      request.clone()
    );

    // If no message to process (might be a status update), acknowledge
    if (!incomingMessage) {
      // Check if it's a status update
      const body = await request.json();
      if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
        const status = body.entry[0].changes[0].value.statuses[0];
        await handleWhatsAppStatusUpdate(status.id, status.status);
      }
      return NextResponse.json({ success: true });
    }

    const phoneNumber = incomingMessage.sessionKey;
    const userMessage = incomingMessage.content;

    // Extract phone number ID from the raw payload for routing
    const phoneNumberId = extractPhoneNumberIdFromPayload(incomingMessage.metadata.rawPayload);

    if (!phoneNumberId) {
      console.error("No phone number ID found in webhook payload");
      return NextResponse.json({ success: true });
    }

    // Find the company using the phone number ID (uses mapping table first)
    const company = await findCompanyByPhoneNumberId(phoneNumberId);

    if (!company) {
      console.error("No WhatsApp-enabled company found");
      return NextResponse.json({ success: true }); // Acknowledge but don't process
    }

    // Get full company details
    const companyDetails = await prisma.company.findUnique({
      where: { id: company.id },
      select: {
        id: true,
        slug: true,
        name: true,
        aiApiKey: true,
        aiEndpoint: true,
        aiModel: true,
        aiSystemPrompt: true,
        aiBotName: true,
        aiGreeting: true,
        aiPersonality: true,
        language: true,
        whatsappEnabled: true,
        whatsappGreeting: true,
      },
    });

    if (!companyDetails || !companyDetails.whatsappEnabled) {
      console.error("Company WhatsApp not enabled:", company.id);
      return NextResponse.json({ success: true });
    }

    const language = companyDetails.language || "en";
    const t = getTranslator(language);

    // Check if company has AI configured
    if (!companyDetails.aiApiKey) {
      console.error("AI not configured for company:", company.id);
      // Send error message to user
      const errorMessage = formatForWhatsApp(
        t("botChat.errors.assistantUnavailable"),
        undefined,
        language
      );
      errorMessage.to = phoneNumber;
      await whatsappAdapter.send(errorMessage, company.id);
      return NextResponse.json({ success: true });
    }

    // Get company owner for subscription checks
    const ownerId = await getCompanyOwnerId(company.id);
    if (!ownerId) {
      console.error("Company owner not found:", company.id);
      return NextResponse.json({ success: true });
    }

    // Check subscription status
    const subscriptionStatus = await checkSubscriptionActive(ownerId);
    if (!subscriptionStatus.active) {
      console.error("Subscription not active for company:", company.id);
      const errorMessage = formatForWhatsApp(
        t("botChat.errors.serviceUnavailable"),
        undefined,
        language
      );
      errorMessage.to = phoneNumber;
      await whatsappAdapter.send(errorMessage, company.id);
      return NextResponse.json({ success: true });
    }

    // Check chat limit
    const chatLimitResult = await checkChatLimit(ownerId);
    if (!chatLimitResult.allowed) {
      console.error("Chat limit exceeded for company:", company.id);
      const errorMessage = formatForWhatsApp(
        t("botChat.errors.usageLimitReached"),
        undefined,
        language
      );
      errorMessage.to = phoneNumber;
      await whatsappAdapter.send(errorMessage, company.id);
      return NextResponse.json({ success: true });
    }

    // Find or create WhatsApp session
    const { sessionId, isNew } = await findOrCreateWhatsAppSession(
      company.id,
      phoneNumber,
      incomingMessage.metadata.userName
    );

    // If new session, send greeting
    if (isNew && companyDetails.whatsappGreeting) {
      const greetingMessage = formatForWhatsApp(
        companyDetails.whatsappGreeting,
        undefined,
        language
      );
      greetingMessage.to = phoneNumber;
      const greetingResult = await whatsappAdapter.send(greetingMessage, company.id);

      if (greetingResult.success && greetingResult.messageId) {
        const greetingMsg = await saveChatMessage(sessionId, "assistant", companyDetails.whatsappGreeting);
        await prisma.chatMessage.update({
          where: { id: greetingMsg.id },
          data: { externalMsgId: greetingResult.messageId, status: "sent" },
        });
      }
    }

    // Send typing indicator immediately (fire-and-forget, covers both bypass & LLM paths)
    if (incomingMessage.metadata.messageId) {
      sendTypingIndicator(company.id, incomingMessage.metadata.messageId);
    }

    // --- Booking selection bypass: handle button/list replies directly (no LLM) ---
    const messageType = incomingMessage.metadata.messageType || "text";
    const replyId = incomingMessage.metadata.replyId;

    // Reject unsupported message types (images, documents, audio, video)
    if (messageType === "unsupported") {
      const reply = formatForWhatsApp(
        t("botChat.errors.textOnlySupported"),
        undefined,
        language
      );
      reply.to = phoneNumber;
      await whatsappAdapter.send(reply, company.id);
      return NextResponse.json({ success: true });
    }

    // Hoist session+user lookup (reused by both booking bypass and LLM paths)
    const sessionWithUser = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (replyId && (messageType === "button_reply" || messageType === "list_reply")) {
      const selection = parseWhatsAppSelection(messageType, userMessage, replyId);

      if (selection && selection.type !== "text") {
        const bookingAction = selectionToBookingAction(selection, userMessage);

        if (bookingAction) {
          // Check if we have an active booking state (or will create one lazily)
          const bookingState = await getBookingState(sessionId);

          // Only bypass if we have active state OR it's a service selection (which creates state lazily)
          if (bookingState?.active || bookingAction.type === "service") {
            // Save user message
            const userMsg = await saveChatMessage(sessionId, "user", userMessage);
            if (incomingMessage.metadata.messageId) {
              await prisma.chatMessage.update({
                where: { id: userMsg.id },
                data: { externalMsgId: incomingMessage.metadata.messageId, status: "delivered" },
              });
            }

            const toolContext: ToolContext = {
              companyId: company.id,
              companyName: companyDetails.name,
              companySlug: companyDetails.slug,
              sessionId,
              language,
              channel: "whatsapp",
            };

            if (sessionWithUser?.user) {
              toolContext.userId = sessionWithUser.user.id;
              toolContext.userEmail = sessionWithUser.user.email;
              toolContext.userName = sessionWithUser.user.name || undefined;
            }

            const result = await handleBookingSelection(toolContext, sessionId, bookingAction);

            // Save assistant response (0 tokens - no LLM)
            const assistantMsg = await saveChatMessage(sessionId, "assistant", result.assistantMessage, 0, 0);

            // Parse and format for WhatsApp
            const { text, ui } = parseRichMessage(result.assistantMessage);
            const outgoingMessage = formatForWhatsApp(text, ui, language);
            outgoingMessage.to = phoneNumber;

            const sendResult = await whatsappAdapter.send(outgoingMessage, company.id);

            if (sendResult.success && sendResult.messageId) {
              await prisma.chatMessage.update({
                where: { id: assistantMsg.id },
                data: { externalMsgId: sendResult.messageId, status: "sent" },
              });
            }

            return NextResponse.json({ success: true });
          }
          // No active state and not a service selection — fall through to LLM
        }
      }
    }

    // --- Normal LLM flow ---

    // Get chat history
    const history = await getChatHistory(sessionId);
    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Save user message
    const userMsg = await saveChatMessage(sessionId, "user", userMessage);
    if (incomingMessage.metadata.messageId) {
      await prisma.chatMessage.update({
        where: { id: userMsg.id },
        data: {
          externalMsgId: incomingMessage.metadata.messageId,
          status: "delivered",
        },
      });
    }

    // Build company context
    const companyContext: CompanyContext = {
      id: companyDetails.id,
      slug: companyDetails.slug,
      name: companyDetails.name,
      botName: companyDetails.aiBotName,
      greeting: companyDetails.aiGreeting,
      personality: companyDetails.aiPersonality,
      language,
    };

    // Build user context from hoisted session lookup
    let userContext: UserContext | null = null;
    if (sessionWithUser?.user?.email) {
      userContext = {
        id: sessionWithUser.user.id,
        email: sessionWithUser.user.email,
        name: sessionWithUser.user.name,
      };
    }

    // Load booking state for LLM context
    const bookingState = await getBookingState(sessionId);

    // Generate AI response
    const { response, usage } = await chat(
      companyContext,
      {
        apiKey: companyDetails.aiApiKey,
        endpoint: companyDetails.aiEndpoint || undefined,
        model: companyDetails.aiModel || undefined,
        systemPrompt: companyDetails.aiSystemPrompt || undefined,
      },
      messages,
      userMessage,
      userContext,
      sessionId,
      bookingState,
      "whatsapp"
    );

    // Save assistant response with token usage
    const assistantMsg = await saveChatMessage(sessionId, "assistant", response, usage.inputTokens, usage.outputTokens);

    // Parse the response for rich content
    const { text, ui } = parseRichMessage(response);

    // Format response for WhatsApp
    const outgoingMessage = formatForWhatsApp(text, ui, language);
    outgoingMessage.to = phoneNumber;

    // Send response
    const sendResult = await whatsappAdapter.send(outgoingMessage, company.id);

    // Update message status
    if (sendResult.success && sendResult.messageId) {
      await prisma.chatMessage.update({
        where: { id: assistantMsg.id },
        data: {
          externalMsgId: sendResult.messageId,
          status: "sent",
        },
      });
    }

    // Increment chat usage with token data
    const newTokenCount = await incrementChatUsage(ownerId, 1, usage, chatLimitResult.limit > 0 ? chatLimitResult.limit : undefined);

    // Fire-and-forget: check if usage threshold crossed and notify admin
    if (!chatLimitResult.unlimited) {
      checkAndNotifyUsageThresholds({
        userId: ownerId,
        companyId: company.id,
        companyName: companyDetails!.name,
        currentTokens: newTokenCount,
        limit: chatLimitResult.limit,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  }
}
