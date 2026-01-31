import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import { useChatbotTranslations } from "../chatbot-translations";

// Floating chat bubble icon
const FloatingChatBubble: React.FC<{
  delay: number;
  position: { x: number; y: number };
  size: number;
}> = ({ delay, position, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - delay, [0, 20], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sine wave floating motion
  const floatY = Math.sin((frame - delay) * 0.08) * 6;
  const floatX = Math.cos((frame - delay) * 0.06) * 4;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        opacity,
        transform: `translate(${floatX}px, ${floatY}px)`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={`${colors.primary}40`}>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    </div>
  );
};

export const ChatbotHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useChatbotTranslations();

  // Line 1 animation
  const line1Opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line1Y = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const line1SlideY = interpolate(line1Y, [0, 1], [40, 0]);

  // Line 2 animation (gradient text)
  const line2Opacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Y = spring({
    fps,
    frame: frame - 15,
    config: { damping: 15, stiffness: 80 },
  });

  const line2SlideY = interpolate(line2Y, [0, 1], [40, 0]);

  // Question mark animation
  const questionScale = spring({
    fps,
    frame: frame - 20,
    config: { damping: 10, stiffness: 100 },
  });

  // Fade out for transition
  const fadeOut = interpolate(frame, [70, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating chat bubbles positions
  const bubbles = [
    { delay: 5, position: { x: 200, y: 250 }, size: 40 },
    { delay: 15, position: { x: 1650, y: 300 }, size: 48 },
    { delay: 25, position: { x: 300, y: 650 }, size: 36 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating chat bubbles */}
      {bubbles.map((bubble, index) => (
        <FloatingChatBubble key={index} {...bubble} />
      ))}

      {/* Main text */}
      <div
        style={{
          opacity: fadeOut,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1SlideY}px)`,
          }}
        >
          <span
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
          </span>
        </div>

        {/* Line 2 with gradient and question mark */}
        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2SlideY}px)`,
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
    </AbsoluteFill>
  );
};
