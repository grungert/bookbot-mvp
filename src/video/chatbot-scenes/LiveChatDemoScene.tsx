import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import {
  ChatBubble,
  ServiceCard,
  TimeSlots,
  Confirmation,
} from "../chatbot-components/ChatWidgetMockup";
import { useChatbotTranslations } from "../chatbot-translations";

export const LiveChatDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useChatbotTranslations();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const titleSlideY = interpolate(titleY, [0, 1], [40, 0]);

  // Widget container animation
  const widgetOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const widgetScale = spring({
    fps,
    frame: frame - 10,
    config: { damping: 15, stiffness: 80 },
  });

  const widgetSlideX = interpolate(widgetScale, [0, 1], [50, 0]);

  // Floating animation
  const floatY = Math.sin(frame * 0.04) * 4;
  const floatRotate = Math.sin(frame * 0.025) * 0.8;

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
          gap: 80,
          width: "100%",
          maxWidth: 1400,
        }}
      >
        {/* Left side - Title panel */}
        <div
          style={{
            flex: "0 0 480px",
            opacity: titleOpacity,
            transform: `translateY(${titleSlideY}px)`,
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 28,
            padding: "48px 52px",
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
              fontSize: 56,
              fontWeight: fontWeights.bold,
              color: "white",
              margin: 0,
              marginBottom: 24,
              lineHeight: 1.2,
            }}
          >
            {t.liveChatDemo.title}{" "}
            <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              {t.liveChatDemo.titleHighlight}
            </span>
          </h2>

          {/* Feature highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              }
              text="Natural conversation booking"
              delay={50}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              }
              text="Real-time availability"
              delay={70}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
              }
              text="Instant confirmations"
              delay={90}
            />
          </div>
        </div>

        {/* Right side - Chat widget mockup */}
        <div
          style={{
            opacity: widgetOpacity,
            transform: `translateX(${widgetSlideX}px) translateY(${floatY}px) perspective(1000px) rotateY(${floatRotate}deg)`,
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
              width: 380,
              height: 600,
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: 24,
              padding: 14,
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
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  background: colors.gradients.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="7" width="14" height="12" rx="2" />
                  <circle cx="9" cy="12" r="1.5" fill={colors.primary} />
                  <circle cx="15" cy="12" r="1.5" fill={colors.accent} />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: fonts.primary, fontSize: 16, fontWeight: fontWeights.semibold, color: colors.text }}>
                  {t.liveChatDemo.chat.botName}
                </div>
                <div style={{ fontFamily: fonts.primary, fontSize: 12, color: colors.success, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.success }} />
                  {t.liveChatDemo.chat.online}
                </div>
              </div>
            </div>

            {/* Chat content */}
            <div style={{ flex: 1, padding: "14px 10px", overflow: "hidden" }}>
              {/* User message 1 */}
              <ChatBubble
                message={t.liveChatDemo.chat.messages.user1}
                isUser={true}
                startFrame={30}
                typingDuration={35}
              />

              {/* Bot response with services */}
              <ChatBubble
                message={t.liveChatDemo.chat.messages.bot1}
                isUser={false}
                startFrame={80}
                typingDuration={25}
              />

              {/* Service cards */}
              <div style={{ marginLeft: 46, marginBottom: 12, display: "flex", gap: 10 }}>
                {t.liveChatDemo.chat.services.map((service, index) => (
                  <ServiceCard
                    key={index}
                    name={service.name}
                    price={service.price}
                    icon={service.icon as "scissors" | "brush"}
                    startFrame={110}
                    delay={index * 15}
                  />
                ))}
              </div>

              {/* User message 2 */}
              <ChatBubble
                message={t.liveChatDemo.chat.messages.user2}
                isUser={true}
                startFrame={150}
                typingDuration={35}
              />

              {/* Bot response with time slots */}
              <ChatBubble
                message={t.liveChatDemo.chat.messages.bot2}
                isUser={false}
                startFrame={200}
                typingDuration={25}
              />

              {/* Time slots */}
              <TimeSlots
                times={t.liveChatDemo.chat.times}
                startFrame={230}
                selectedIndex={0}
              />

              {/* User message 3 */}
              <ChatBubble
                message={t.liveChatDemo.chat.messages.user3}
                isUser={true}
                startFrame={260}
                typingDuration={20}
              />

              {/* Confirmation */}
              <Confirmation
                text={t.liveChatDemo.chat.confirmation}
                startFrame={280}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
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
          width: 44,
          height: 44,
          borderRadius: 12,
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
          fontSize: 18,
          fontWeight: fontWeights.medium,
          color: "white",
        }}
      >
        {text}
      </span>
    </div>
  );
};
