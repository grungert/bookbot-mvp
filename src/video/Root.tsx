import { Composition } from "remotion";
import { BookBotVideo } from "./BookBotVideo";
import { ChatbotVideo } from "./ChatbotVideo";
import { WhatsAppVideo } from "./WhatsAppVideo";
import { ViberVideo } from "./ViberVideo";
import { MobileVideo } from "./MobileVideo";
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
import {
  VIBER_COMP_NAME,
  defaultViberProps,
  VIBER_DURATION_IN_FRAMES,
  VIBER_VIDEO_FPS,
  VIBER_VIDEO_HEIGHT,
  VIBER_VIDEO_WIDTH,
} from "./viberConstants";
import {
  MOBILE_COMP_NAME,
  defaultMobileProps,
  MOBILE_DURATION_IN_FRAMES,
  MOBILE_VIDEO_FPS,
  MOBILE_VIDEO_HEIGHT,
  MOBILE_VIDEO_WIDTH,
} from "./mobileConstants";

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

      {/* Viber Feature Video - 36 seconds at 1080p */}
      <Composition
        id={VIBER_COMP_NAME}
        component={ViberVideo}
        durationInFrames={VIBER_DURATION_IN_FRAMES}
        fps={VIBER_VIDEO_FPS}
        width={VIBER_VIDEO_WIDTH}
        height={VIBER_VIDEO_HEIGHT}
        defaultProps={defaultViberProps}
      />

      {/* Mobile Feature Video - 40 seconds at 1080p */}
      <Composition
        id={MOBILE_COMP_NAME}
        component={MobileVideo}
        durationInFrames={MOBILE_DURATION_IN_FRAMES}
        fps={MOBILE_VIDEO_FPS}
        width={MOBILE_VIDEO_WIDTH}
        height={MOBILE_VIDEO_HEIGHT}
        defaultProps={defaultMobileProps}
      />
    </>
  );
};
