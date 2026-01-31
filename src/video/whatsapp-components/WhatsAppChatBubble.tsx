import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { whatsappColors } from "../whatsappConstants";

// WhatsApp-styled chat bubble component
export const WhatsAppChatBubble: React.FC<{
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
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: 240,
          padding: "10px 14px",
          borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          background: isUser ? whatsappColors.light : whatsappColors.incoming,
          color: colors.text,
          fontFamily: fonts.primary,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.4,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          position: "relative",
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
        {/* WhatsApp tail */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            [isUser ? "right" : "left"]: -6,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: isUser ? "0 0 12px 8px" : "0 8px 12px 0",
            borderColor: isUser
              ? `transparent transparent ${whatsappColors.light} transparent`
              : `transparent ${whatsappColors.incoming} transparent transparent`,
          }}
        />
      </div>
    </div>
  );
};

// WhatsApp service card component
export const WhatsAppServiceCard: React.FC<{
  name: string;
  price: string;
  icon: "scissors" | "brush" | "spa" | "relax";
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

  const iconMap = {
    scissors: ScissorsIcon,
    brush: BrushIcon,
    spa: SpaIcon,
    relax: RelaxIcon,
  };
  const IconComponent = iconMap[icon] || SpaIcon;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        background: "white",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: `1px solid ${whatsappColors.primary}30`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 140,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${whatsappColors.primary}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: whatsappColors.primary,
        }}
      >
        <IconComponent size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 13,
            fontWeight: fontWeights.semibold,
            color: colors.text,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: fonts.primary,
            fontSize: 14,
            fontWeight: fontWeights.bold,
            color: whatsappColors.primary,
          }}
        >
          {price}
        </div>
      </div>
    </div>
  );
};

// WhatsApp time slots component
export const WhatsAppTimeSlots: React.FC<{
  times: readonly string[];
  startFrame: number;
  selectedIndex?: number;
}> = ({ times, startFrame, selectedIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 0, marginBottom: 8 }}>
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
              padding: "8px 14px",
              borderRadius: 8,
              background: selected ? whatsappColors.primary : "white",
              color: selected ? "white" : colors.text,
              fontFamily: fonts.primary,
              fontSize: 13,
              fontWeight: fontWeights.medium,
              boxShadow: selected
                ? `0 2px 8px ${whatsappColors.primary}40`
                : "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: selected
                ? `1px solid ${whatsappColors.primary}`
                : `1px solid ${whatsappColors.primary}30`,
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

// WhatsApp confirmation component
export const WhatsAppConfirmation: React.FC<{
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
        gap: 10,
        marginTop: 16,
        opacity,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: whatsappColors.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
          boxShadow: `0 0 20px ${whatsappColors.primary}60`,
        }}
      >
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
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
          fontSize: 14,
          fontWeight: fontWeights.semibold,
          color: whatsappColors.primary,
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

const SpaIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.49 9.63c-.18-2.79-1.31-5.51-3.43-7.63a12.188 12.188 0 00-3.55 7.63c1.28.68 2.46 1.56 3.49 2.63 1.03-1.06 2.21-1.94 3.49-2.63zm-6.5 2.65c-.14-.1-.3-.19-.45-.29-.28.27-.57.54-.88.79l.18.13c.16.11.37.07.48-.09.1-.14.11-.32.04-.47l.63-.07zM12 15.45C9.85 12.17 6.18 10 2 10c0 5.32 3.36 9.82 8.03 11.49.63.23 1.29.4 1.97.51.68-.12 1.34-.29 1.97-.51C18.64 19.82 22 15.32 22 10c-4.18 0-7.85 2.17-10 5.45z" />
  </svg>
);

const RelaxIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);
