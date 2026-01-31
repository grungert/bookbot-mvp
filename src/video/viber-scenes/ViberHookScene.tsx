import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights, colors } from "../styles/theme";
import { ViberGradientText } from "../viber-components/ViberGradientText";
import { useViberTranslations } from "../viber-translations";
import { viberColors } from "../viberConstants";

// Floating Viber icon
const FloatingViberIcon: React.FC<{
  delay: number;
  position: { x: number; y: number };
  size: number;
}> = ({ delay, position, size }) => {
  const frame = useCurrentFrame();

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
      {/* Viber phone icon */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill={`${viberColors.primary}60`}>
        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
      </svg>
    </div>
  );
};

export const ViberHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useViberTranslations();

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

  // Fade out for transition
  const fadeOut = interpolate(frame, [70, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating Viber icons positions
  const icons = [
    { delay: 5, position: { x: 200, y: 250 }, size: 40 },
    { delay: 15, position: { x: 1650, y: 300 }, size: 48 },
    { delay: 25, position: { x: 300, y: 650 }, size: 36 },
    { delay: 10, position: { x: 1500, y: 600 }, size: 42 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating Viber icons */}
      {icons.map((icon, index) => (
        <FloatingViberIcon key={index} {...icon} />
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

        {/* Line 2 with gradient */}
        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2SlideY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <ViberGradientText
            style={{
              fontFamily: fonts.heading,
              fontSize: 76,
              fontWeight: fontWeights.bold,
            }}
          >
            {t.hook.line2}
          </ViberGradientText>
        </div>
      </div>
    </AbsoluteFill>
  );
};
