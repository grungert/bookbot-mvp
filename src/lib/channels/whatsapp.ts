/**
 * WhatsApp Channel Adapter
 *
 * Integrates with Meta Cloud API for WhatsApp Business Platform.
 * Handles incoming webhooks, message parsing, and outgoing message formatting.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { safeDecrypt } from "@/lib/encryption";
import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
  SendResult,
} from "./types";
import { formatForWhatsApp } from "./formatter";
import type { ChatUIComponent } from "@/components/chat/types";

const WHATSAPP_API_VERSION = "v18.0";
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

/**
 * Meta webhook payload types
 */
interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

interface MetaWebhookChange {
  value: {
    messaging_product: "whatsapp";
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: { name: string };
      wa_id: string;
    }>;
    messages?: Array<{
      from: string;
      id: string;
      timestamp: string;
      type: "text" | "button" | "interactive" | "image" | "document" | "audio" | "video";
      text?: { body: string };
      button?: { text: string; payload: string };
      interactive?: {
        type: "button_reply" | "list_reply";
        button_reply?: { id: string; title: string };
        list_reply?: { id: string; title: string; description?: string };
      };
    }>;
    statuses?: Array<{
      id: string;
      status: "sent" | "delivered" | "read" | "failed";
      timestamp: string;
      recipient_id: string;
      errors?: Array<{ code: number; title: string }>;
    }>;
  };
  field: string;
}

interface MetaWebhookPayload {
  object: "whatsapp_business_account";
  entry: MetaWebhookEntry[];
}

/**
 * Get global WhatsApp settings from SystemSettings
 * Used as fallback when company doesn't have credentials configured
 */
async function getGlobalSettings(): Promise<{
  accessToken: string | null;
  phoneNumberId: string | null;
  verifyToken: string | null;
  appSecret: string | null;
}> {
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: {
        in: [
          "META_ACCESS_TOKEN",
          "META_PHONE_NUMBER_ID",
          "META_WEBHOOK_VERIFY_TOKEN",
          "META_APP_SECRET",
        ],
      },
    },
  });

  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  return {
    accessToken: settingsMap.get("META_ACCESS_TOKEN") || null,
    phoneNumberId: settingsMap.get("META_PHONE_NUMBER_ID") || null,
    verifyToken: settingsMap.get("META_WEBHOOK_VERIFY_TOKEN") || null,
    appSecret: settingsMap.get("META_APP_SECRET") || null,
  };
}

/**
 * Company-specific WhatsApp credentials
 */
interface CompanyWhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string | null;
}

/**
 * Get company-specific WhatsApp credentials (decrypted)
 * Returns null if credentials are not configured
 */
export async function getCompanyCredentials(
  companyId: string
): Promise<CompanyWhatsAppCredentials | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      whatsappEnabled: true,
      whatsappAccessToken: true,
      whatsappPhoneNumberId: true,
      whatsappAppSecret: true,
    },
  });

  if (!company) {
    return null;
  }

  if (!company.whatsappEnabled) {
    return null;
  }

  // Decrypt the access token
  const accessToken = safeDecrypt(company.whatsappAccessToken);
  if (!accessToken) {
    return null;
  }

  if (!company.whatsappPhoneNumberId) {
    return null;
  }

  // Decrypt the app secret (optional)
  const appSecret = safeDecrypt(company.whatsappAppSecret);

  return {
    accessToken,
    phoneNumberId: company.whatsappPhoneNumberId,
    appSecret,
  };
}

/**
 * Find company by WhatsApp phone number ID using the mapping table
 */
export async function findCompanyByPhoneNumberId(
  phoneNumberId: string
): Promise<{ id: string; slug: string } | null> {
  // First, check the phone mapping table
  const mapping = await prisma.whatsAppPhoneMapping.findUnique({
    where: { phoneNumberId },
    include: {
      company: {
        select: { id: true, slug: true },
      },
    },
  });

  if (mapping) {
    return mapping.company;
  }

  // Fallback: check companies directly by whatsappPhoneNumberId
  const companyByField = await prisma.company.findFirst({
    where: {
      whatsappEnabled: true,
      whatsappPhoneNumberId: phoneNumberId,
    },
    select: { id: true, slug: true },
  });

  if (companyByField) {
    return companyByField;
  }

  return null;
}

/**
 * Verify Meta webhook signature
 */
async function verifySignature(
  request: Request,
  body: string,
  appSecret: string
): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(body).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send message via WhatsApp Cloud API
 */
async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: OutgoingMessage
): Promise<SendResult> {
  const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`;

  // Build the message payload
  let payload: Record<string, unknown>;

  if (message.buttons && message.buttons.length > 0) {
    // Interactive button message
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        header: message.header ? { type: "text", text: message.header } : undefined,
        body: { text: message.content },
        footer: message.footer ? { text: message.footer } : undefined,
        action: {
          buttons: message.buttons.map((btn) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: btn.label.substring(0, 20), // Max 20 chars
            },
          })),
        },
      },
    };
  } else if (message.listSections && message.listSections.length > 0) {
    // Interactive list message
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: message.header ? { type: "text", text: message.header } : undefined,
        body: { text: message.content },
        footer: message.footer ? { text: message.footer } : undefined,
        action: {
          button: message.listButtonText || "Select",
          sections: message.listSections.map((section) => ({
            title: section.title,
            rows: section.items.map((item) => ({
              id: item.id,
              title: item.title.substring(0, 24), // Max 24 chars
              description: item.description?.substring(0, 72), // Max 72 chars
            })),
          })),
        },
      },
    };
  } else if (message.media) {
    // Media message
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: message.media.type,
      [message.media.type]: {
        link: message.media.url,
        caption: message.media.caption,
        filename: message.media.filename,
      },
    };
  } else {
    // Simple text message
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message.content,
      },
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * WhatsApp Channel Adapter implementation
 */
export const whatsappAdapter: ChannelAdapter = {
  name: "whatsapp",

  async parseIncoming(request: Request): Promise<IncomingMessage | null> {
    try {
      const body = await request.text();
      const payload: MetaWebhookPayload = JSON.parse(body);

      // Validate it's a WhatsApp message
      if (payload.object !== "whatsapp_business_account") {
        return null;
      }

      // Find the first message in the payload
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== "messages") continue;

          const messages = change.value.messages;
          if (!messages || messages.length === 0) continue;

          const message = messages[0];
          const contact = change.value.contacts?.[0];

          // Extract message content based on type
          let content = "";
          let messageType: IncomingMessage["metadata"]["messageType"] = "text";
          let replyId: string | undefined;

          switch (message.type) {
            case "text":
              content = message.text?.body || "";
              break;

            case "button":
              content = message.button?.text || "";
              replyId = message.button?.payload;
              messageType = "button_reply";
              break;

            case "interactive":
              if (message.interactive?.type === "button_reply") {
                content = message.interactive.button_reply?.title || "";
                replyId = message.interactive.button_reply?.id;
                messageType = "button_reply";
              } else if (message.interactive?.type === "list_reply") {
                content = message.interactive.list_reply?.title || "";
                replyId = message.interactive.list_reply?.id;
                messageType = "list_reply";
              }
              break;

            default:
              // Unsupported message type
              content = `[${message.type} message]`;
              messageType = "unsupported";
          }

          return {
            sessionKey: message.from, // Phone number as session key
            content,
            metadata: {
              messageId: message.id,
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              userName: contact?.profile?.name,
              messageType,
              replyId,
              rawPayload: payload,
            },
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error parsing WhatsApp message:", error);
      return null;
    }
  },

  formatResponse(
    response: string,
    ui?: { component: string; props: Record<string, unknown> }
  ): OutgoingMessage {
    return formatForWhatsApp(response, ui as ChatUIComponent);
  },

  async send(message: OutgoingMessage, companyId: string): Promise<SendResult> {
    // Try company-specific credentials first
    const companyCredentials = await getCompanyCredentials(companyId);

    if (companyCredentials) {
      return sendWhatsAppMessage(
        companyCredentials.phoneNumberId,
        companyCredentials.accessToken,
        message.to,
        message
      );
    }

    // Fall back to global settings
    const settings = await getGlobalSettings();

    if (!settings.accessToken || !settings.phoneNumberId) {
      return {
        success: false,
        error: "WhatsApp not configured. Missing access token or phone number ID.",
      };
    }

    return sendWhatsAppMessage(
      settings.phoneNumberId,
      settings.accessToken,
      message.to,
      message
    );
  },

  async verifyWebhook(request: Request): Promise<boolean> {
    const settings = await getGlobalSettings();

    if (!settings.appSecret) {
      console.warn("WhatsApp webhook verification: No app secret configured");
      return false;
    }

    const body = await request.clone().text();
    return verifySignature(request, body, settings.appSecret);
  },

  async handleVerificationChallenge(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const settings = await getGlobalSettings();

    if (mode === "subscribe" && token === settings.verifyToken) {
      console.log("WhatsApp webhook verified");
      return new Response(challenge, { status: 200 });
    }

    console.warn("WhatsApp webhook verification failed");
    return new Response("Forbidden", { status: 403 });
  },
};

/**
 * Send a typing indicator (and mark message as read) via WhatsApp Cloud API.
 * Fire-and-forget: errors are logged but never thrown.
 */
export async function sendTypingIndicator(
  companyId: string,
  messageId: string
): Promise<void> {
  try {
    // Resolve credentials: company-specific first, then global fallback
    let phoneNumberId: string | null = null;
    let accessToken: string | null = null;

    const companyCredentials = await getCompanyCredentials(companyId);
    if (companyCredentials) {
      phoneNumberId = companyCredentials.phoneNumberId;
      accessToken = companyCredentials.accessToken;
    } else {
      const settings = await getGlobalSettings();
      phoneNumberId = settings.phoneNumberId;
      accessToken = settings.accessToken;
    }

    if (!phoneNumberId || !accessToken) {
      console.warn("sendTypingIndicator: missing WhatsApp credentials, skipping");
      return;
    }

    const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: {
          type: "text",
        },
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.warn("sendTypingIndicator: API error", data);
    }
  } catch (error) {
    console.warn("sendTypingIndicator: failed", error);
  }
}

/**
 * Update message status based on webhook status update
 */
export async function handleWhatsAppStatusUpdate(
  messageId: string,
  status: "sent" | "delivered" | "read" | "failed"
): Promise<void> {
  try {
    await prisma.chatMessage.updateMany({
      where: { externalMsgId: messageId },
      data: { status },
    });
  } catch (error) {
    console.error("Error updating message status:", error);
  }
}

/**
 * Find a user by phone number, trying both with and without '+' prefix
 * to handle WhatsApp format (no '+') vs user-entered format (with '+').
 */
async function findUserByPhone(phoneNumber: string) {
  const variants = [phoneNumber];
  if (phoneNumber.startsWith("+")) {
    variants.push(phoneNumber.slice(1));
  } else {
    variants.push(`+${phoneNumber}`);
  }
  return prisma.user.findFirst({
    where: { phone: { in: variants } },
  });
}

export async function findOrCreateWhatsAppSession(
  companyId: string,
  phoneNumber: string,
  userName?: string
): Promise<{ sessionId: string; isNew: boolean }> {
  // Look for existing session within the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingSession = await prisma.chatSession.findFirst({
    where: {
      companyId,
      channel: "whatsapp",
      phoneNumber,
      updatedAt: { gte: twentyFourHoursAgo },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existingSession) {
    // If the session has no linked user, try to link now
    if (!existingSession.userId) {
      const user = await findUserByPhone(phoneNumber);
      if (user) {
        await prisma.chatSession.update({
          where: { id: existingSession.id },
          data: { updatedAt: new Date(), userId: user.id },
        });
        return { sessionId: existingSession.id, isNew: false };
      }
    }
    // Update the session's updatedAt
    await prisma.chatSession.update({
      where: { id: existingSession.id },
      data: { updatedAt: new Date() },
    });
    return { sessionId: existingSession.id, isNew: false };
  }

  // Try to find user by phone number (with +/without + normalization)
  const existingUser = await findUserByPhone(phoneNumber);

  // Create new session
  const newSession = await prisma.chatSession.create({
    data: {
      companyId,
      userId: existingUser?.id,
      channel: "whatsapp",
      phoneNumber,
    },
  });

  return { sessionId: newSession.id, isNew: true };
}
