/**
 * Channel Integration Types
 *
 * These types define the abstraction layer for multi-channel chat integration.
 * The same AI logic can be used across web, WhatsApp, Messenger, etc.
 */

export type ChannelType = "web" | "whatsapp" | "messenger" | "instagram" | "sms" | "telegram";

/**
 * Message delivery status
 */
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

/**
 * Incoming message from any channel
 */
export interface IncomingMessage {
  /** Unique key to identify the session (phone number, user ID, etc.) */
  sessionKey: string;
  /** The message content */
  content: string;
  /** Channel-specific metadata */
  metadata: {
    /** External message ID from the platform */
    messageId?: string;
    /** Timestamp of the message */
    timestamp?: Date;
    /** User's display name if available */
    userName?: string;
    /** User's profile picture URL if available */
    profilePicture?: string;
    /** Message type (text, button_reply, etc.) */
    messageType?: "text" | "button_reply" | "list_reply" | "image" | "document" | "unsupported";
    /** For button/list replies, the original button/list ID */
    replyId?: string;
    /** Raw payload for debugging */
    rawPayload?: unknown;
  };
}

/**
 * Button for interactive messages (WhatsApp, Messenger)
 */
export interface MessageButton {
  id: string;
  label: string;
}

/**
 * List item for WhatsApp list messages
 */
export interface ListItem {
  id: string;
  title: string;
  description?: string;
}

/**
 * List section for WhatsApp list messages
 */
export interface ListSection {
  title?: string;
  items: ListItem[];
}

/**
 * Outgoing message to any channel
 */
export interface OutgoingMessage {
  /** Recipient identifier (phone number, user ID, etc.) */
  to: string;
  /** Text content of the message */
  content: string;
  /** Optional interactive buttons (max 3 for WhatsApp) */
  buttons?: MessageButton[];
  /** Optional list sections for WhatsApp */
  listSections?: ListSection[];
  /** Button text for list messages */
  listButtonText?: string;
  /** Header text for interactive messages */
  header?: string;
  /** Footer text for interactive messages */
  footer?: string;
  /** Media attachment */
  media?: {
    type: "image" | "document" | "audio" | "video";
    url: string;
    caption?: string;
    filename?: string;
  };
}

/**
 * Result of sending a message
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Channel adapter interface
 * Each channel (WhatsApp, Messenger, etc.) implements this interface
 */
export interface ChannelAdapter {
  /** Channel name */
  name: ChannelType;

  /**
   * Parse incoming webhook request into a standardized message
   */
  parseIncoming(request: Request): Promise<IncomingMessage | null>;

  /**
   * Format AI response for this channel
   * Converts rich UI components to channel-appropriate format
   */
  formatResponse(
    response: string,
    ui?: {
      component: string;
      props: Record<string, unknown>;
    }
  ): OutgoingMessage;

  /**
   * Send a message through this channel
   */
  send(message: OutgoingMessage, companyId: string): Promise<SendResult>;

  /**
   * Verify webhook signature/authenticity
   */
  verifyWebhook(request: Request): Promise<boolean>;

  /**
   * Handle webhook verification challenge (GET request)
   */
  handleVerificationChallenge?(request: Request): Promise<Response>;
}

/**
 * Global channel settings stored in SystemSettings
 */
export interface GlobalChannelSettings {
  // Meta (WhatsApp/Messenger/Instagram) settings
  metaAppId?: string;
  metaAppSecret?: string;
  metaAccessToken?: string;
  metaWebhookVerifyToken?: string;
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;

  // Twilio (SMS) settings
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;

  // Telegram settings
  telegramBotToken?: string;
}

/**
 * Per-company channel settings stored in Company model
 */
export interface CompanyChannelSettings {
  // WhatsApp
  whatsappEnabled: boolean;
  whatsappPhoneNumber?: string;
  whatsappGreeting?: string;
  whatsappAutoReply?: string;
}

/**
 * Channel context passed to handlers
 */
export interface ChannelContext {
  channel: ChannelType;
  companyId: string;
  companySlug: string;
  sessionId: string;
  phoneNumber?: string;
  externalId?: string;
}
