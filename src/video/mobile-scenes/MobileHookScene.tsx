import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights, colors } from "../styles/theme";
import { MobileGradientText } from "../mobile-components/MobileGradientText";
import { useMobileTranslations } from "../mobile-translations";
import { mobileColors } from "../mobileConstants";

// Floating mobile device icon
const FloatingMobileIcon: React.FC<{
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
      {/* Mobile phone icon */}
      <svg width={size} height={size} viewBox="0 0 24 24" fill={`${mobileColors.primary}60`}>
        <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
      </svg>
    </div>
  );
};

export const MobileHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useMobileTranslations();

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

  // Floating mobile icons positions
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
      {/* Floating mobile icons */}
      {icons.map((icon, index) => (
        <FloatingMobileIcon key={index} {...icon} />
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
          <MobileGradientText
            style={{
              fontFamily: fonts.heading,
              fontSize: 76,
              fontWeight: fontWeights.bold,
            }}
          >
            {t.hook.line2}
          </MobileGradientText>
        </div>
      </div>
    </AbsoluteFill>
  );
};
