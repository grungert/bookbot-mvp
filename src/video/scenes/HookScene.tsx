import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { BookBotLogo } from "../components/BookBotLogo";
import { GradientText } from "../components/AnimatedBackground";
import { useTranslations } from "../translations";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslations();

  // Text animation - "Still managing bookings manually?"
  const textOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const textSlideY = interpolate(textY, [0, 1], [40, 0]);

  // Question mark animation
  const questionScale = spring({
    fps,
    frame: frame - 20,
    config: { damping: 10, stiffness: 100 },
  });

  // Fade to logo transition
  const fadeOutText = interpolate(frame, [80, 100], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoFadeIn = interpolate(frame, [85, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoScale = spring({
    fps,
    frame: frame - 85,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Main question text */}
      <div
        style={{
          opacity: textOpacity * fadeOutText,
          transform: `translateY(${textSlideY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 76,
            fontWeight: fontWeights.bold,
            color: colors.text,
            textAlign: "center",
            lineHeight: 1.2,
                      }}
        >
          {t.hook.line1}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <GradientText
            style={{
              fontFamily: fonts.heading,
              fontSize: 76,
              fontWeight: fontWeights.bold,
            }}
          >
            {t.hook.line2}
          </GradientText>
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 76,
              fontWeight: fontWeights.bold,
              color: colors.primary,
              transform: `scale(${questionScale})`,
              display: "inline-block",
              textShadow: `0 0 40px ${colors.primary}60`,
            }}
          >
            ?
          </span>
        </div>
      </div>

      {/* BookBot Logo fading in */}
      <div
        style={{
          position: "absolute",
          opacity: logoFadeIn,
          transform: `scale(${logoScale})`,
        }}
      >
        <BookBotLogo size="large" animateIn={false} />
      </div>
    </AbsoluteFill>
  );
};
