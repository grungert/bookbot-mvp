import { z } from "zod";

// Chatbot Video composition
export const CHATBOT_COMP_NAME = "ChatbotVideo";

export const ChatbotCompositionProps = z.object({
  title: z.string(),
  locale: z.enum(["en", "sr"]).default("en"),
});

export const defaultChatbotProps: z.infer<typeof ChatbotCompositionProps> = {
  title: "AI Website Chatbot",
  locale: "en",
};

export const CHATBOT_DURATION_IN_FRAMES = 1350; // 45 seconds at 30fps
export const CHATBOT_VIDEO_WIDTH = 1920;
export const CHATBOT_VIDEO_HEIGHT = 1080;
export const CHATBOT_VIDEO_FPS = 30;

// Scene timing configuration for Chatbot video (in frames at 30fps)
export const chatbotSceneTiming = {
  hook: { start: 0, duration: 90 },           // 0-3s (90 frames)
  hero: { start: 90, duration: 150 },         // 3-8s (150 frames)
  installDemo: { start: 240, duration: 180 }, // 8-14s (180 frames)
  liveChatDemo: { start: 420, duration: 300 }, // 14-24s (300 frames)
  features: { start: 720, duration: 240 },    // 24-32s (240 frames)
  useCases: { start: 960, duration: 180 },    // 32-38s (180 frames)
  cta: { start: 1140, duration: 210 },        // 38-45s (210 frames)
};
