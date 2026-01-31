import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { viberColors } from "../viberConstants";

// Viber phone mockup component
export const ViberPhone: React.FC<{
  botName: string;
  onlineText: string;
  startFrame: number;
  scrollOffset?: number;
  children: React.ReactNode;
}> = ({ botName, onlineText, startFrame, scrollOffset = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const widgetScale = spring({
    fps,
    frame: localFrame,
    config: { damping: 15, stiffness: 80 },
  });

  const widgetOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle floating animation
  const floatY = Math.sin(frame * 0.04) * 4;
  const floatRotate = Math.sin(frame * 0.025) * 0.8;

  return (
    <div
      style={{
        opacity: widgetOpacity,
        transform: `scale(${widgetScale}) translateY(${floatY}px) perspective(1000px) rotateY(${floatRotate}deg)`,
        position: "relative",
      }}
    >
      {/* Shadow for 3D depth */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 20,
          right: -20,
          bottom: -20,
          background: `linear-gradient(135deg, ${viberColors.primary}30 0%, ${viberColors.secondary}25 100%)`,
          borderRadius: 28,
          filter: "blur(30px)",
          zIndex: -1,
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          width: 340,
          height: 580,
          background: "#ffffff",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: `
            0 25px 50px -12px ${viberColors.primary}35,
            0 20px 40px -15px ${viberColors.secondary}30,
            0 0 0 1px rgba(0, 0, 0, 0.1)
          `,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Viber Header */}
        <div
          style={{
            background: viberColors.headerBg,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Back arrow */}
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>

          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${viberColors.primary} 0%, ${viberColors.secondary} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="white">
              <rect x="5" y="7" width="14" height="12" rx="2" />
              <circle cx="9" cy="12" r="1.5" fill={viberColors.headerBg} />
              <circle cx="15" cy="12" r="1.5" fill={viberColors.headerBg} />
            </svg>
          </div>

          {/* Name and status */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: fonts.primary,
                fontSize: 16,
                fontWeight: fontWeights.semibold,
                color: "white",
              }}
            >
              {botName}
            </div>
            <div
              style={{
                fontFamily: fonts.primary,
                fontSize: 12,
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              {onlineText}
            </div>
          </div>

          {/* Action icons */}
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
          </svg>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </div>

        {/* Chat content area */}
        <div
          style={{
            flex: 1,
            background: viberColors.background,
            padding: "12px 10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              transform: `translateY(-${scrollOffset}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {children}
          </div>
        </div>

        {/* Input bar */}
        <div
          style={{
            background: viberColors.background,
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="#54656f">
            <path d="M9.5 12c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5zm5 1.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5-1.5.7-1.5 1.5.7 1.5 1.5 1.5zm3 2.5c0 2.3-3.1 4-7 4s-7-1.7-7-4v-.5c1.2 1.3 3.9 2 6.5 2s5.3-.7 6.5-2v.5z" />
          </svg>
          <div
            style={{
              flex: 1,
              background: "white",
              borderRadius: 20,
              padding: "10px 16px",
              fontFamily: fonts.primary,
              fontSize: 14,
              color: "#667781",
            }}
          >
            Type a message
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: viberColors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
