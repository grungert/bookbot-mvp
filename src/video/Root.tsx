import { Composition } from "remotion";
import { BookBotVideo } from "./BookBotVideo";
import {
  BOOKBOT_COMP_NAME,
  defaultBookBotProps,
  BOOKBOT_DURATION_IN_FRAMES,
  BOOKBOT_VIDEO_FPS,
  BOOKBOT_VIDEO_HEIGHT,
  BOOKBOT_VIDEO_WIDTH,
} from "./constants";

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
    </>
  );
};
