import { Composition } from "remotion";
import { BookBotVideo } from "./BookBotVideo";
import { ChatbotVideo } from "./ChatbotVideo";
import { WhatsAppVideo } from "./WhatsAppVideo";
import {
  BOOKBOT_COMP_NAME,
  defaultBookBotProps,
  BOOKBOT_DURATION_IN_FRAMES,
  BOOKBOT_VIDEO_FPS,
  BOOKBOT_VIDEO_HEIGHT,
  BOOKBOT_VIDEO_WIDTH,
} from "./constants";
import {
  CHATBOT_COMP_NAME,
  defaultChatbotProps,
  CHATBOT_DURATION_IN_FRAMES,
  CHATBOT_VIDEO_FPS,
  CHATBOT_VIDEO_HEIGHT,
  CHATBOT_VIDEO_WIDTH,
} from "./chatbotConstants";
import {
  WHATSAPP_COMP_NAME,
  defaultWhatsAppProps,
  WHATSAPP_DURATION_IN_FRAMES,
  WHATSAPP_VIDEO_FPS,
  WHATSAPP_VIDEO_HEIGHT,
  WHATSAPP_VIDEO_WIDTH,
} from "./whatsappConstants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* BookBot Promotional Video - 60 seconds at 1080p */}
      <Composition
        id={BOOKBOT_COMP_NAME}
        component={BookBotVideo}
        durationInFrames={BOOKBOT_DURATION_IN_FRAMES}
        fps={BOOKBOT_VIDEO_FPS}
        width={BOOKBOT_VIDEO_WIDTH}
        height={BOOKBOT_VIDEO_HEIGHT}
        defaultProps={defaultBookBotProps}
      />

      {/* Chatbot Feature Video - 45 seconds at 1080p */}
      <Composition
        id={CHATBOT_COMP_NAME}
        component={ChatbotVideo}
        durationInFrames={CHATBOT_DURATION_IN_FRAMES}
        fps={CHATBOT_VIDEO_FPS}
        width={CHATBOT_VIDEO_WIDTH}
        height={CHATBOT_VIDEO_HEIGHT}
        defaultProps={defaultChatbotProps}
      />

      {/* WhatsApp Feature Video - 45 seconds at 1080p */}
      <Composition
        id={WHATSAPP_COMP_NAME}
        component={WhatsAppVideo}
        durationInFrames={WHATSAPP_DURATION_IN_FRAMES}
        fps={WHATSAPP_VIDEO_FPS}
        width={WHATSAPP_VIDEO_WIDTH}
        height={WHATSAPP_VIDEO_HEIGHT}
        defaultProps={defaultWhatsAppProps}
      />
    </>
  );
};
