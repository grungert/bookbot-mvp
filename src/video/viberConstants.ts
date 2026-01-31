import { z } from "zod";

// Viber Video composition
export const VIBER_COMP_NAME = "ViberVideo";

export const ViberCompositionProps = z.object({
  title: z.string(),
  locale: z.enum(["en", "sr"]).default("en"),
});

export const defaultViberProps: z.infer<typeof ViberCompositionProps> = {
  title: "Viber Booking",
  locale: "en",
};

export const VIBER_DURATION_IN_FRAMES = 1200; // 40 seconds at 30fps
export const VIBER_VIDEO_WIDTH = 1920;
export const VIBER_VIDEO_HEIGHT = 1080;
export const VIBER_VIDEO_FPS = 30;

// Scene timing configuration for Viber video (in frames at 30fps)
export const viberSceneTiming = {
  hook: { start: 0, duration: 90 },           // 0-3s (90 frames)
  hero: { start: 90, duration: 150 },         // 3-8s (150 frames)
  demo: { start: 240, duration: 480 },        // 8-24s (480 frames) - extended for full booking flow
  features: { start: 720, duration: 180 },    // 24-30s (180 frames)
  useCases: { start: 900, duration: 180 },    // 30-36s (180 frames)
  cta: { start: 1080, duration: 120 },        // 36-40s (120 frames)
};

// Viber brand colors
export const viberColors = {
  primary: "#7360F2",      // Viber purple
  secondary: "#5A4BC0",    // Darker purple
  light: "#E8E5FF",        // Light purple (outgoing message bubble)
  dark: "#4A3D9E",         // Dark purple
  incoming: "#ffffff",     // Incoming message bubble
  background: "#F5F5F5",   // Chat background
  headerBg: "#7360F2",     // Header background
};
