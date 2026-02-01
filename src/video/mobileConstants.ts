import { z } from "zod";

// Mobile Video composition
export const MOBILE_COMP_NAME = "MobileVideo";

export const MobileCompositionProps = z.object({
  title: z.string(),
  locale: z.enum(["en", "sr"]).default("en"),
});

export const defaultMobileProps: z.infer<typeof MobileCompositionProps> = {
  title: "Mobile Dashboard",
  locale: "en",
};

export const MOBILE_DURATION_IN_FRAMES = 1200; // 40 seconds at 30fps
export const MOBILE_VIDEO_WIDTH = 1920;
export const MOBILE_VIDEO_HEIGHT = 1080;
export const MOBILE_VIDEO_FPS = 30;

// Scene timing configuration for Mobile video (in frames at 30fps)
export const mobileSceneTiming = {
  hook: { start: 0, duration: 90 },           // 0-3s (90 frames)
  hero: { start: 90, duration: 150 },         // 3-8s (150 frames)
  demo: { start: 240, duration: 480 },        // 8-24s (480 frames) - dashboard interaction flow
  features: { start: 720, duration: 180 },    // 24-30s (180 frames)
  useCases: { start: 900, duration: 180 },    // 30-36s (180 frames)
  cta: { start: 1080, duration: 120 },        // 36-40s (120 frames)
};

// Mobile brand colors (Blue/Purple theme)
export const mobileColors = {
  primary: "#3b82f6",       // Blue-500
  secondary: "#a855f7",     // Purple-500
  light: "#EFF6FF",         // Blue-50 (card backgrounds)
  dark: "#1e40af",          // Blue-800
  accent: "#c4b5fd",        // Purple-200
  background: "#F8FAFC",    // Slate-50
  headerBg: "#3b82f6",      // Blue header
  success: "#22C55E",       // Green for confirmations
  notification: "#EF4444",  // Red notification dot
};
