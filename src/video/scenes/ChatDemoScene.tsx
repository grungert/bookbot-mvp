import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, shadows } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";

// Inline chat components to avoid Sequence issues
const ChatBubbleInline: React.FC<{
  message: string;
  isUser?: boolean;
  startFrame: number;
  typingDuration?: number;
}> = ({ message, isUser = false, startFrame, typingDuration = 30 }) => {
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
        marginBottom: 10,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: colors.gradients.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <rect x="5" y="7" width="14" height="12" rx="2" fill="white" />
            <circle cx="9" cy="12" r="1.5" fill={colors.primary} />
            <circle cx="15" cy="12" r="1.5" fill={colors.accent} />
          </svg>
        </div>
      )}

      <div
        style={{
          maxWidth: 200,
          padding: "8px 12px",
          borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          background: isUser
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)"
            : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: isUser ? colors.textInverse : colors.text,
          fontFamily: fonts.primary,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.4,
          boxShadow: isUser
            ? "0 4px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            : "0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
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
            width: 32,
            height: 32,
            borderRadius: 16,
            background: colors.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20 Q4 14 12 14 Q20 14 20 20" />
          </svg>
        </div>
      )}
    </div>
  );
};

const ServiceCardInline: React.FC<{
  title: string;
  price: string;
  duration: string;
  startFrame: number;
}> = ({ title, price, duration, startFrame }) => {
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

  const slideY = interpolate(slideProgress, [0, 1], [20, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 10,
        padding: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        marginLeft: 40,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 13,
          fontWeight: 600,
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: fonts.primary, fontSize: 16, fontWeight: 700, color: colors.primary }}>
          {price}
        </span>
        <span style={{ fontFamily: fonts.primary, fontSize: 11, color: colors.textLight }}>
          {duration}
        </span>
      </div>
    </div>
  );
};

const TimeSlotsInline: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const times = ["9:00 AM", "11:30 AM", "2:00 PM"];

  return (
    <div style={{ marginLeft: 40, marginBottom: 10 }}>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 12,
          color: colors.textLight,
          marginBottom: 6,
          opacity: interpolate(localFrame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Available times:
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {times.map((time, i) => {
          const delay = i * 8;
          const slotFrame = localFrame - delay;
          if (slotFrame < 0) return null;

          const scale = spring({
            fps,
            frame: slotFrame,
            config: { damping: 12, stiffness: 120 },
          });

          const selected = i === 2;

          return (
            <div
              key={time}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: selected
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)"
                  : "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: selected ? colors.textInverse : colors.text,
                fontFamily: fonts.primary,
                fontSize: 11,
                fontWeight: 500,
                boxShadow: selected
                  ? "0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
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
    </div>
  );
};

const ConfirmationInline: React.FC<{ startFrame: number }> = ({ startFrame }) => {
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
          background: colors.success,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
          boxShadow: `0 0 16px ${colors.success}50`,
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
          fontWeight: 600,
          color: colors.success,
        }}
      >
        Booking Confirmed!
      </div>
    </div>
  );
};

// Feature highlight component
const FeatureHighlight: React.FC<{
  icon: React.ReactNode;
  text: string;
  delay: number;
}> = ({ icon, text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideX = interpolate(progress, [0, 1], [-30, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity,
        transform: `translateX(${slideX}px)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: fonts.primary,
          fontSize: 17,
          fontWeight: 500,
          color: "white",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const ChatDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const phoneScale = spring({
    fps,
    frame: frame - 15,
    config: { damping: 15, stiffness: 80 },
  });

  const phoneOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle floating animation for 3D effect
  const floatY = Math.sin(frame * 0.05) * 4;
  const floatRotate = Math.sin(frame * 0.03) * 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          width: "100%",
          maxWidth: 1300,
        }}
      >
        {/* Left side - Title and features with gradient glass background */}
        <div
          style={{
            flex: "0 0 520px",
            opacity: titleOpacity,
            transform: `translateY(${interpolate(titleY, [0, 1], [40, 0])}px)`,
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 28,
            padding: "40px 44px",
            boxShadow: `
              0 25px 50px -12px rgba(59, 130, 246, 0.4),
              0 15px 30px -8px rgba(124, 58, 237, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)
            `,
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 52,
              fontWeight: 700,
              color: "white",
              margin: 0,
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            Book through{" "}
            <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>conversation</span>
          </h2>
          <p
            style={{
              fontFamily: fonts.primary,
              fontSize: 18,
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.85)",
              margin: 0,
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Your AI assistant handles bookings 24/7, just like chatting with a real receptionist.
          </p>

          {/* Feature highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              }
              text="Instant booking confirmation"
              delay={40}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              }
              text="Available slots in real-time"
              delay={60}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                </svg>
              }
              text="Automatic reminders sent"
              delay={80}
            />
          </div>
        </div>

        {/* Right side - Phone mockup with 3D effect */}
        <div
          style={{
            opacity: phoneOpacity,
            transform: `scale(${phoneScale}) translateY(${floatY}px) perspective(1000px) rotateY(${floatRotate}deg)`,
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* Phone shadow for 3D depth */}
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 20,
              right: -20,
              bottom: -20,
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)",
              borderRadius: 32,
              filter: "blur(30px)",
              zIndex: -1,
            }}
          />

          {/* Phone frame with enhanced styling */}
          <div
            style={{
              width: 360,
              height: 640,
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: 28,
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
              {/* Chat header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom: `1px solid ${colors.textLight}20`,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: colors.gradients.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
                    <rect x="5" y="7" width="14" height="12" rx="2" />
                    <circle cx="9" cy="12" r="1.5" fill={colors.primary} />
                    <circle cx="15" cy="12" r="1.5" fill={colors.accent} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: fonts.primary, fontSize: 13, fontWeight: 600, color: colors.text }}>
                    BookBot Assistant
                  </div>
                  <div style={{ fontFamily: fonts.primary, fontSize: 10, color: colors.success, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: colors.success }} />
                    Online
                  </div>
                </div>
              </div>

              {/* Channel indicator strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderBottom: `1px solid ${colors.textLight}15`,
                  marginBottom: 10,
                  flexShrink: 0,
                }}
              >
                {/* WhatsApp - active */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: "#25D36620",
                    border: "1.5px solid #25D366",
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span style={{ fontFamily: fonts.primary, fontSize: 10, fontWeight: 600, color: "#25D366" }}>
                    WhatsApp
                  </span>
                </div>

                {/* Viber - inactive */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: `${colors.textLight}10`,
                  }}
                >
                  <svg width={12} height={12} viewBox="0 0 24 24" fill={colors.textLight}>
                    <path d="M11.398 0C9.79.019 5.975.309 3.76 2.391 1.992 4.152 1.383 6.698 1.319 9.855c-.064 3.157-.143 9.071 5.553 10.728h.004l-.004 2.458s-.037.994.618 1.196c.792.245 1.258-.51 2.015-1.327.415-.448.99-1.106 1.423-1.609 3.93.33 6.95-.424 7.294-.536.793-.257 5.283-.833 6.014-6.796.754-6.148-.356-10.036-2.32-11.778C19.953.97 14.506-.018 11.398 0" />
                  </svg>
                  <span style={{ fontFamily: fonts.primary, fontSize: 10, fontWeight: 500, color: colors.textLight }}>
                    Viber
                  </span>
                </div>

                {/* Web - inactive */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: `${colors.textLight}10`,
                  }}
                >
                  <svg width={12} height={12} viewBox="0 0 24 24" fill={colors.textLight}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                  <span style={{ fontFamily: fonts.primary, fontSize: 10, fontWeight: 500, color: colors.textLight }}>
                    Web
                  </span>
                </div>
              </div>

            {/* Chat content */}
            <div style={{ flex: 1, padding: "0 6px", overflow: "hidden" }}>
              <ChatBubbleInline
                message="I'd like to book a haircut"
                isUser={true}
                startFrame={30}
                typingDuration={35}
              />
              <ChatBubbleInline
                message="Sure! Here are available services:"
                isUser={false}
                startFrame={80}
                typingDuration={25}
              />
              <ServiceCardInline
                title="Men's Haircut"
                price="$35"
                duration="45 min"
                startFrame={130}
              />
              <TimeSlotsInline startFrame={180} />
              <ConfirmationInline startFrame={260} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
