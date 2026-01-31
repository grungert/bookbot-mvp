import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";

// Chat bubble component
export const ChatBubble: React.FC<{
  message: string;
  isUser?: boolean;
  startFrame: number;
  typingDuration?: number;
}> = ({ message, isUser = false, startFrame, typingDuration = 35 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const slideProgress = spring({
    fps,
    frame: localFrame,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const typingProgress = interpolate(localFrame, [0, typingDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const visibleChars = Math.floor(message.length * typingProgress);
  const displayMessage = message.slice(0, visibleChars);
  const showTypingIndicator = visibleChars < message.length;
  const dotProgress = localFrame % 30;

  const slideX = isUser
    ? interpolate(slideProgress, [0, 1], [30, 0])
    : interpolate(slideProgress, [0, 1], [-30, 0]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        opacity,
        transform: `translateX(${slideX}px)`,
        marginBottom: 12,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: colors.gradients.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            flexShrink: 0,
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <rect x="5" y="7" width="14" height="12" rx="2" fill="white" />
            <circle cx="9" cy="12" r="1.5" fill={colors.primary} />
            <circle cx="15" cy="12" r="1.5" fill={colors.accent} />
          </svg>
        </div>
      )}

      <div
        style={{
          maxWidth: 220,
          padding: "10px 14px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)"
            : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: isUser ? colors.textInverse : colors.text,
          fontFamily: fonts.primary,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.4,
          boxShadow: isUser
            ? "0 4px 16px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            : "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          border: isUser
            ? "1px solid rgba(255, 255, 255, 0.2)"
            : "1px solid rgba(255, 255, 255, 0.8)",
        }}
      >
        {displayMessage}
        {showTypingIndicator && (
          <span style={{ marginLeft: 2 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  opacity: interpolate(
                    dotProgress,
                    [i * 10, i * 10 + 10, i * 10 + 20],
                    [0.3, 1, 0.3],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                }}
              >
                .
              </span>
            ))}
          </span>
        )}
      </div>

      {isUser && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: colors.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 10,
            flexShrink: 0,
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20 Q4 14 12 14 Q20 14 20 20" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Service card component
export const ServiceCard: React.FC<{
  name: string;
  price: string;
  icon: "scissors" | "brush";
  startFrame: number;
  delay?: number;
}> = ({ name, price, icon, startFrame, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame - delay;

  if (localFrame < 0) return null;

  const slideProgress = spring({
    fps,
    frame: localFrame,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideY = interpolate(slideProgress, [0, 1], [20, 0]);

  const IconComponent = icon === "scissors" ? ScissorsIcon : BrushIcon;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 160,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${colors.primary}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.primary,
        }}
      >
        <IconComponent size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 14,
            fontWeight: fontWeights.semibold,
            color: colors.text,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 16,
            fontWeight: fontWeights.bold,
            color: colors.primary,
          }}
        >
          {price}
        </div>
      </div>
    </div>
  );
};

// Time slots component
export const TimeSlots: React.FC<{
  times: string[];
  startFrame: number;
  selectedIndex?: number;
}> = ({ times, startFrame, selectedIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 46 }}>
      {times.map((time, i) => {
        const delay = i * 10;
        const slotFrame = localFrame - delay;
        if (slotFrame < 0) return null;

        const scale = spring({
          fps,
          frame: slotFrame,
          config: { damping: 12, stiffness: 120 },
        });

        const selected = i === selectedIndex;

        return (
          <div
            key={time}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: selected
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)"
                : "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: selected ? colors.textInverse : colors.text,
              fontFamily: fonts.primary,
              fontSize: 13,
              fontWeight: fontWeights.medium,
              boxShadow: selected
                ? "0 4px 12px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                : "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
              border: selected
                ? "1px solid rgba(255, 255, 255, 0.2)"
                : "1px solid rgba(255, 255, 255, 0.8)",
              transform: `scale(${scale})`,
            }}
          >
            {time}
          </div>
        );
      })}
    </div>
  );
};

// Confirmation component
export const Confirmation: React.FC<{
  text: string;
  startFrame: number;
}> = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const scale = spring({
    fps,
    frame: localFrame,
    config: { damping: 10, stiffness: 100 },
  });

  const checkProgress = interpolate(localFrame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginTop: 20,
        opacity,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: colors.success,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
          boxShadow: `0 0 20px ${colors.success}60`,
        }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12 L10 17 L19 8"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={20}
            strokeDashoffset={20 * (1 - checkProgress)}
          />
        </svg>
      </div>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 16,
          fontWeight: fontWeights.semibold,
          color: colors.success,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Icons
const ScissorsIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z" />
  </svg>
);

const BrushIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z" />
  </svg>
);

// Main Chat Widget Mockup
interface ChatWidgetMockupProps {
  botName: string;
  onlineText: string;
  startFrame: number;
}

export const ChatWidgetMockup: React.FC<ChatWidgetMockupProps> = ({
  botName,
  onlineText,
  startFrame,
}) => {
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
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)",
          borderRadius: 28,
          filter: "blur(30px)",
          zIndex: -1,
        }}
      />

      {/* Widget container */}
      <div
        style={{
          width: 360,
          height: 560,
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: 24,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          boxShadow: `
            0 25px 50px -12px rgba(59, 130, 246, 0.25),
            0 20px 40px -15px rgba(168, 85, 247, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05)
          `,
          border: "1px solid rgba(59, 130, 246, 0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderBottom: `1px solid ${colors.textLight}20`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: colors.gradients.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="white">
              <rect x="5" y="7" width="14" height="12" rx="2" />
              <circle cx="9" cy="12" r="1.5" fill={colors.primary} />
              <circle cx="15" cy="12" r="1.5" fill={colors.accent} />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: fonts.primary, fontSize: 15, fontWeight: fontWeights.semibold, color: colors.text }}>
              {botName}
            </div>
            <div style={{ fontFamily: fonts.primary, fontSize: 12, color: colors.success, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.success }} />
              {onlineText}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: colors.textLight }} />
            <div style={{ width: 4, height: 4, borderRadius: 2, background: colors.textLight }} />
            <div style={{ width: 4, height: 4, borderRadius: 2, background: colors.textLight }} />
          </div>
        </div>

        {/* Chat content area - will be filled by parent */}
        <div style={{ flex: 1, padding: "12px 8px", overflow: "hidden" }}>
          {/* Content is rendered by parent component */}
        </div>
      </div>
    </div>
  );
};
