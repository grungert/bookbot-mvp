/**
 * Channel Integration Module
 *
 * Provides multi-channel support for the booking chatbot.
 * Currently supports: WhatsApp (via Meta Cloud API)
 * Coming soon: Messenger, Instagram, SMS, Telegram
 */

// Export types
export * from "./types";

// Export formatters
export {
  formatForWhatsApp,
  parseWhatsAppSelection,
  formatTextMessage,
  formatErrorMessage,
} from "./formatter";

// Export adapters
export {
  whatsappAdapter,
  findOrCreateWhatsAppSession,
  handleWhatsAppStatusUpdate,
} from "./whatsapp";
