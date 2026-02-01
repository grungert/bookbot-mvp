import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { mobileColors } from "../mobileConstants";

// Stats card component
const StatsCard: React.FC<{
  label: string;
  value: string;
  delay: number;
  color: string;
}> = ({ label, value, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        flex: 1,
        background: "white",
        borderRadius: 12,
        padding: "14px 12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 10,
          fontWeight: fontWeights.medium,
          color: "#9CA3AF",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 26,
          fontWeight: fontWeights.bold,
          color: color,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const MobilePhone: React.FC<{
  headerText: string;
  statsToday: string;
  statsWeek: string;
  todayCount: string;
  weekCount: string;
  startFrame: number;
  children?: React.ReactNode;
}> = ({
  headerText,
  statsToday,
  statsWeek,
  todayCount,
  weekCount,
  startFrame,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall container animation
  const containerProgress = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 15, stiffness: 80 },
  });

  const containerOpacity = interpolate(frame - startFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerScale = interpolate(containerProgress, [0, 1], [0.95, 1]);
  const containerSlideX = interpolate(containerProgress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity: containerOpacity,
        transform: `scale(${containerScale}) translateX(${containerSlideX}px)`,
        width: 300,
        height: 560,
        background: mobileColors.background,
        borderRadius: 32,
        overflow: "hidden",
        boxShadow: `
          0 50px 100px -12px rgba(0, 0, 0, 0.25),
          0 25px 50px -12px rgba(0, 0, 0, 0.15),
          inset 0 0 0 1px rgba(255, 255, 255, 0.1)
        `,
        position: "relative",
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 32,
          border: "6px solid #1F2937",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />

      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: 24,
          background: "#1F2937",
          borderRadius: 16,
          zIndex: 101,
        }}
      />

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${mobileColors.primary} 0%, ${mobileColors.secondary} 100%)`,
          padding: "52px 16px 20px 16px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 18,
            fontWeight: fontWeights.bold,
            color: "white",
            textAlign: "center",
          }}
        >
          {headerText}
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: "calc(100% - 140px)",
          overflowY: "hidden",
        }}
      >
        {/* Stats row */}
        <div style={{ display: "flex", gap: 10 }}>
          <StatsCard
            label={statsToday}
            value={todayCount}
            delay={startFrame + 15}
            color={mobileColors.primary}
          />
          <StatsCard
            label={statsWeek}
            value={weekCount}
            delay={startFrame + 25}
            color={mobileColors.secondary}
          />
        </div>

        {/* Dynamic children (appointment cards, etc.) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {children}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 6,
          right: 6,
          height: 56,
          background: "white",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 16px",
          boxShadow: "0 -2px 16px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Calendar - Active */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill={mobileColors.primary}>
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
          </svg>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              background: mobileColors.primary,
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="#9CA3AF">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
          </svg>
        </div>

        {/* Settings */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="#9CA3AF">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
