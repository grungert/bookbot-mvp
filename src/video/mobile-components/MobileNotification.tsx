import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { mobileColors } from "../mobileConstants";

export const MobileNotification: React.FC<{
  title: string;
  subtitle: string;
  startFrame: number;
  hideFrame?: number;
}> = ({ title, subtitle, startFrame, hideFrame = 9999 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in from top
  const slideProgress = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 15, stiffness: 100 },
  });

  const slideY = interpolate(slideProgress, [0, 1], [-80, 0]);

  // Fade out when hideFrame is reached
  const hideOpacity = interpolate(
    frame,
    [hideFrame, hideFrame + 15],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(frame - startFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * hideOpacity;

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: "50%",
        transform: `translateX(-50%) translateY(${slideY}px)`,
        opacity,
        background: "rgba(255, 255, 255, 0.98)",
        borderRadius: 16,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: `
          0 10px 40px rgba(0, 0, 0, 0.15),
          0 4px 12px rgba(0, 0, 0, 0.08)
        `,
        border: "1px solid rgba(0, 0, 0, 0.06)",
        minWidth: 280,
      }}
    >
      {/* App icon with notification dot */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${mobileColors.primary} 0%, ${mobileColors.secondary} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Calendar icon */}
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
          </svg>
        </div>
        {/* Red notification dot */}
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: mobileColors.notification,
            border: "2px solid white",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 15,
            fontWeight: fontWeights.semibold,
            color: "#1F2937",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 13,
            fontWeight: fontWeights.regular,
            color: "#6B7280",
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Time indicator */}
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 12,
          fontWeight: fontWeights.regular,
          color: "#9CA3AF",
        }}
      >
        now
      </div>
    </div>
  );
};
