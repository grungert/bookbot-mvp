import { z } from "zod";

// WhatsApp Video composition
export const WHATSAPP_COMP_NAME = "WhatsAppVideo";

export const WhatsAppCompositionProps = z.object({
  title: z.string(),
  locale: z.enum(["en", "sr"]).default("en"),
});

export const defaultWhatsAppProps: z.infer<typeof WhatsAppCompositionProps> = {
  title: "WhatsApp Booking",
  locale: "en",
};

export const WHATSAPP_DURATION_IN_FRAMES = 1080; // 36 seconds at 30fps
export const WHATSAPP_VIDEO_WIDTH = 1920;
export const WHATSAPP_VIDEO_HEIGHT = 1080;
export const WHATSAPP_VIDEO_FPS = 30;

// Scene timing configuration for WhatsApp video (in frames at 30fps)
export const whatsappSceneTiming = {
  hook: { start: 0, duration: 90 },           // 0-3s (90 frames)
  hero: { start: 90, duration: 150 },         // 3-8s (150 frames)
  demo: { start: 240, duration: 360 },        // 8-20s (360 frames) - extended for confirmation
  features: { start: 600, duration: 180 },    // 20-26s (180 frames) - shortened
  useCases: { start: 780, duration: 180 },    // 26-32s (180 frames)
  cta: { start: 960, duration: 120 },         // 32-36s (120 frames)
};

// WhatsApp brand colors
export const whatsappColors = {
  primary: "#25D366",      // WhatsApp green
  secondary: "#128C7E",    // WhatsApp teal
  light: "#dcf8c6",        // Message bubble green (outgoing)
  dark: "#075E54",         // Dark green
  incoming: "#ffffff",     // Incoming message bubble
  background: "#ece5dd",   // Chat background color
  headerBg: "#075E54",     // Header background
};
