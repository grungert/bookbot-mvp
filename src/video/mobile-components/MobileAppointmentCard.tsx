import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { mobileColors } from "../mobileConstants";

export const MobileAppointmentCard: React.FC<{
  name: string;
  service: string;
  time: string;
  confirmText: string;
  confirmedText: string;
  startFrame: number;
  confirmFrame: number;
}> = ({ name, service, time, confirmText, confirmedText, startFrame, confirmFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 12, stiffness: 80 },
  });

  const opacity = interpolate(frame - startFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const slideY = interpolate(progress, [0, 1], [20, 0]);

  // Confirmation animation
  const isConfirmed = frame >= confirmFrame;
  const confirmProgress = spring({
    fps,
    frame: frame - confirmFrame,
    config: { damping: 12, stiffness: 100 },
  });

  // Button tap animation
  const buttonScale = isConfirmed
    ? interpolate(confirmProgress, [0, 0.3, 1], [1, 0.9, 1])
    : 1;

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) translateY(${slideY}px)`,
        background: "white",
        borderRadius: 16,
        padding: 20,
        boxShadow: `0 4px 20px ${mobileColors.primary}15`,
        border: `1px solid ${mobileColors.primary}20`,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${mobileColors.light} 0%, ${mobileColors.accent} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill={mobileColors.primary}>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: fonts.primary,
              fontSize: 17,
              fontWeight: fontWeights.semibold,
              color: "#1F2937",
              marginBottom: 2,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: fonts.primary,
              fontSize: 14,
              fontWeight: fontWeights.regular,
              color: "#6B7280",
            }}
          >
            {service}
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            padding: "6px 12px",
            borderRadius: 20,
            background: mobileColors.light,
            fontFamily: fonts.primary,
            fontSize: 12,
            fontWeight: fontWeights.semibold,
            color: mobileColors.primary,
          }}
        >
          Pending
        </div>
      </div>

      {/* Time row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          padding: "12px 16px",
          background: "#F9FAFB",
          borderRadius: 10,
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="#6B7280">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
        <span
          style={{
            fontFamily: fonts.primary,
            fontSize: 14,
            fontWeight: fontWeights.medium,
            color: "#374151",
          }}
        >
          {time}
        </span>
      </div>

      {/* Action button */}
      <div
        style={{
          transform: `scale(${buttonScale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            background: isConfirmed
              ? mobileColors.success
              : `linear-gradient(135deg, ${mobileColors.primary} 0%, ${mobileColors.secondary} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: isConfirmed
              ? `0 4px 12px ${mobileColors.success}40`
              : `0 4px 12px ${mobileColors.primary}40`,
            transition: "all 0.2s",
          }}
        >
          {isConfirmed && (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
          <span
            style={{
              fontFamily: fonts.primary,
              fontSize: 16,
              fontWeight: fontWeights.semibold,
              color: "white",
            }}
          >
            {isConfirmed ? confirmedText : confirmText}
          </span>
        </div>
      </div>
    </div>
  );
};
