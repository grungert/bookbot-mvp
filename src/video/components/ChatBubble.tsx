import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius, shadows } from "../styles/theme";

interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  delay?: number;
  typing?: boolean;
  typingDuration?: number;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser = false,
  delay = 0,
  typing = false,
  typingDuration = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const slideProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typing animation
  const typingProgress = interpolate(
    frame - delay,
    [0, typingDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const visibleChars = typing
    ? Math.floor(message.length * typingProgress)
    : message.length;

  const displayMessage = message.slice(0, visibleChars);

  // Typing indicator dots
  const showTypingIndicator = typing && visibleChars < message.length;
  const dotProgress = (frame - delay) % 30;

  const slideX = isUser
    ? interpolate(slideProgress, [0, 1], [50, 0])
    : interpolate(slideProgress, [0, 1], [-50, 0]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        opacity,
        transform: `translateX(${slideX}px)`,
        marginBottom: 10,
      }}
    >
      {/* Avatar for AI */}
      {!isUser && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.full,
            background: colors.gradients.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <rect x="5" y="7" width="14" height="12" rx="2" fill="white" />
            <circle cx="9" cy="12" r="1.5" fill={colors.primary} />
            <circle cx="15" cy="12" r="1.5" fill={colors.accent} />
            <path
              d="M9 15 Q12 17 15 15"
              stroke={colors.primary}
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      )}

      {/* Message Bubble */}
      <div
        style={{
          maxWidth: 240,
          padding: "10px 14px",
          borderRadius: isUser
            ? `${borderRadius.lg}px ${borderRadius.lg}px ${borderRadius.sm}px ${borderRadius.lg}px`
            : `${borderRadius.lg}px ${borderRadius.lg}px ${borderRadius.lg}px ${borderRadius.sm}px`,
          background: isUser ? colors.gradients.primary : colors.surface,
          color: isUser ? colors.textInverse : colors.text,
          fontFamily: fonts.primary,
          fontSize: 14,
          fontWeight: fontWeights.medium,
          lineHeight: 1.4,
          boxShadow: shadows.md,
        }}
      >
        {displayMessage}
        {showTypingIndicator && (
          <span style={{ marginLeft: 4 }}>
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

      {/* Avatar for User */}
      {isUser && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.full,
            background: colors.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
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

// Service card that slides in during chat demo
export const ServiceCard: React.FC<{
  title: string;
  price: string;
  duration: string;
  delay?: number;
}> = ({ title, price, duration, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideY = interpolate(slideProgress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        background: colors.surface,
        borderRadius: borderRadius.md,
        padding: 14,
        boxShadow: shadows.md,
        border: `2px solid ${colors.primary}20`,
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 14,
          fontWeight: fontWeights.semibold,
          color: colors.text,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: fonts.primary,
            fontSize: 18,
            fontWeight: fontWeights.bold,
            color: colors.primary,
          }}
        >
          {price}
        </span>
        <span
          style={{
            fontFamily: fonts.primary,
            fontSize: 12,
            color: colors.textLight,
          }}
        >
          {duration}
        </span>
      </div>
    </div>
  );
};

// Time slot button
export const TimeSlot: React.FC<{
  time: string;
  selected?: boolean;
  delay?: number;
}> = ({ time, selected = false, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 120 },
  });

  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: borderRadius.md,
        background: selected ? colors.primary : colors.surface,
        color: selected ? colors.textInverse : colors.text,
        fontFamily: fonts.primary,
        fontSize: 12,
        fontWeight: fontWeights.medium,
        boxShadow: shadows.sm,
        border: `1px solid ${selected ? colors.primary : colors.primary + "30"}`,
        transform: `scale(${scale})`,
      }}
    >
      {time}
    </div>
  );
};

// Confirmation checkmark
export const ConfirmationCheck: React.FC<{
  delay?: number;
}> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - delay,
    config: { damping: 10, stiffness: 100 },
  });

  const checkProgress = interpolate(frame - delay, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: borderRadius.full,
        background: colors.success,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        boxShadow: `0 0 20px ${colors.success}50`,
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
  );
};
