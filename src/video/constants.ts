import { z } from "zod";

// BookBot Video composition
export const BOOKBOT_COMP_NAME = "BookBotVideo";

export const BookBotCompositionProps = z.object({
  title: z.string(),
  locale: z.enum(["en", "sr"]).default("en"),
});

export const defaultBookBotProps: z.infer<typeof BookBotCompositionProps> = {
  title: "BookBot - Your AI Booking Assistant",
  locale: "en",
};

export const BOOKBOT_DURATION_IN_FRAMES = 1800; // 60 seconds at 30fps
export const BOOKBOT_VIDEO_WIDTH = 1920;
export const BOOKBOT_VIDEO_HEIGHT = 1080;
export const BOOKBOT_VIDEO_FPS = 30;
