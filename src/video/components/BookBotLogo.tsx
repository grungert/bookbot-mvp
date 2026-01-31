import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, shadows } from "../styles/theme";

interface BookBotLogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
  animateIn?: boolean;
  delay?: number;
}

export const BookBotLogo: React.FC<BookBotLogoProps> = ({
  size = "medium",
  showText = true,
  animateIn = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sizes = {
    small: { icon: 40, text: 24 },
    medium: { icon: 64, text: 36 },
    large: { icon: 120, text: 64 },
  };

  const currentSize = sizes[size];

  const scaleProgress = animateIn
    ? spring({
        fps,
        frame: frame - delay,
        config: { damping: 15, stiffness: 100 },
      })
    : 1;

  const opacity = animateIn
    ? interpolate(frame - delay, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const iconSize = currentSize.icon * 0.8;
  const ballSize = iconSize * 0.5;
  const bowlWidth = iconSize;
  const bowlHeight = bowlWidth / 2;
  const overlap = ballSize * 0.2;
  const containerHeight = ballSize + bowlHeight - overlap;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: currentSize.icon * 0.3,
        opacity,
        transform: `scale(${scaleProgress})`,
      }}
    >
      {/* Logo Icon - Ball in Bowl */}
      <div
        style={{
          position: "relative",
          width: bowlWidth,
          height: containerHeight,
        }}
      >
        {/* Ball */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: ballSize,
            height: ballSize,
            top: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
            boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.3)",
          }}
        />
        {/* Bowl */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: bowlWidth,
            height: bowlHeight,
            borderRadius: `0 0 ${bowlWidth}px ${bowlWidth}px`,
            background: `
              radial-gradient(ellipse 100% 80% at 50% 0%, rgba(147, 197, 253, 0.95) 0%, transparent 50%),
              linear-gradient(180deg, rgba(147, 197, 253, 0.85) 0%, rgba(59, 130, 246, 0.75) 40%, rgba(37, 99, 235, 0.8) 70%, rgba(96, 165, 250, 0.7) 100%)
            `,
            boxShadow: `
              inset 0 -4px 8px rgba(255,255,255,0.25),
              inset 0 3px 6px rgba(59, 130, 246, 0.2),
              0 4px 12px rgba(59, 130, 246, 0.25)
            `,
          }}
        />
      </div>

      {/* Logo Text */}
      {showText && (
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: currentSize.text,
            fontWeight: fontWeights.bold,
            color: colors.text,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: colors.primary }}>Book</span>
          <span style={{ color: colors.accent }}>Bot</span>
        </div>
      )}
    </div>
  );
};

// Ball-in-bowl logo icon component
const BallBowlIcon: React.FC<{ size?: number }> = ({ size = 80 }) => {
  const ballSize = size * 0.5;
  const bowlWidth = size;
  const bowlHeight = bowlWidth / 2;
  const overlap = ballSize * 0.2;
  const containerHeight = ballSize + bowlHeight - overlap;

  return (
    <div
      style={{
        position: "relative",
        width: bowlWidth,
        height: containerHeight,
      }}
    >
      {/* Ball - positioned at top center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: ballSize,
          height: ballSize,
          top: 0,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
          boxShadow: "inset -3px -3px 6px rgba(0,0,0,0.15), inset 3px 3px 6px rgba(255,255,255,0.4)",
        }}
      />

      {/* Bowl/Half-circle - positioned at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: bowlWidth,
          height: bowlHeight,
          borderRadius: `0 0 ${bowlWidth}px ${bowlWidth}px`,
          background: `
            radial-gradient(ellipse 100% 80% at 50% 0%, rgba(147, 197, 253, 0.95) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(96, 165, 250, 0.6) 0%, transparent 50%),
            linear-gradient(180deg, rgba(147, 197, 253, 0.85) 0%, rgba(59, 130, 246, 0.75) 40%, rgba(37, 99, 235, 0.8) 70%, rgba(96, 165, 250, 0.7) 100%)
          `,
          boxShadow: `
            inset 0 -8px 16px rgba(255,255,255,0.25),
            inset 0 6px 12px rgba(59, 130, 246, 0.2),
            inset 0 2px 4px rgba(255,255,255,0.5),
            0 6px 20px rgba(59, 130, 246, 0.3)
          `,
        }}
      />
    </div>
  );
};

// Standalone animated logo for CTA scene
export const AnimatedBookBotLogo: React.FC<{
  delay?: number;
}> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounceProgress = spring({
    fps,
    frame: (frame - delay) % 90,
    config: { damping: 8, stiffness: 100 },
  });

  const ballBounce = Math.sin(bounceProgress * Math.PI) * 8;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Logo icon with bounce animation */}
      <div style={{ transform: `translateY(${-ballBounce}px)` }}>
        <BallBowlIcon size={100} />
      </div>

      {/* Logo text */}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: 64,
          fontWeight: fontWeights.bold,
          letterSpacing: "-0.02em",
        }}
      >
        <span style={{ color: colors.primary }}>Book</span>
        <span style={{ color: colors.accent }}>Bot</span>
      </div>
    </div>
  );
};
