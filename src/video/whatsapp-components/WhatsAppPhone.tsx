import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { whatsappColors } from "../whatsappConstants";

// WhatsApp phone mockup component
export const WhatsAppPhone: React.FC<{
  botName: string;
  onlineText: string;
  startFrame: number;
  children: React.ReactNode;
}> = ({ botName, onlineText, startFrame, children }) => {
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
          background: `linear-gradient(135deg, ${whatsappColors.primary}30 0%, ${whatsappColors.secondary}25 100%)`,
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
            0 25px 50px -12px ${whatsappColors.primary}35,
            0 20px 40px -15px ${whatsappColors.secondary}30,
            0 0 0 1px rgba(0, 0, 0, 0.1)
          `,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* WhatsApp Header */}
        <div
          style={{
            background: whatsappColors.headerBg,
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
              background: `linear-gradient(135deg, ${whatsappColors.primary} 0%, ${whatsappColors.secondary} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="white">
              <rect x="5" y="7" width="14" height="12" rx="2" />
              <circle cx="9" cy="12" r="1.5" fill={whatsappColors.headerBg} />
              <circle cx="15" cy="12" r="1.5" fill={whatsappColors.headerBg} />
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
            <path d="M15.9 14.3H15L14.7 14C15.6 12.9 16.1 11.5 16.1 10C16.1 6.7 13.4 4 10.1 4C6.8 4 4 6.7 4 10C4 13.3 6.7 16 10 16C11.5 16 12.9 15.5 14 14.6L14.3 14.9V15.8L19.3 20.8L20.7 19.4L15.9 14.3ZM10.1 14C7.9 14 6.1 12.2 6.1 10C6.1 7.8 7.9 6 10.1 6C12.3 6 14.1 7.8 14.1 10C14.1 12.2 12.3 14 10.1 14Z" />
          </svg>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </div>

        {/* Chat content area */}
        <div
          style={{
            flex: 1,
            background: whatsappColors.background,
            padding: "12px 10px",
            overflow: "hidden",
          }}
        >
          {children}
        </div>

        {/* Input bar */}
        <div
          style={{
            background: whatsappColors.background,
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
              background: whatsappColors.primary,
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
