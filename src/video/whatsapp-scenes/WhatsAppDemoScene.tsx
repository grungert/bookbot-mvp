import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { WhatsAppPhone } from "../whatsapp-components/WhatsAppPhone";
import {
  WhatsAppChatBubble,
  WhatsAppServiceCard,
  WhatsAppTimeSlots,
  WhatsAppConfirmation,
} from "../whatsapp-components/WhatsAppChatBubble";
import { useWhatsAppTranslations } from "../whatsapp-translations";
import { whatsappColors } from "../whatsappConstants";

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
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
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

export const WhatsAppDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useWhatsAppTranslations();

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
            background: `linear-gradient(135deg, ${whatsappColors.primary}80 0%, ${whatsappColors.secondary}80 100%)`,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 28,
            padding: "48px 52px",
            boxShadow: `
              0 25px 50px -12px ${whatsappColors.primary}40,
              0 15px 30px -8px ${whatsappColors.secondary}30,
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.05)
            `,
            border: "1px solid rgba(255, 255, 255, 0.35)",
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
            {t.demo.title}{" "}
            <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              {t.demo.titleHighlight}
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
              text={t.demo.features.natural}
              delay={50}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              }
              text={t.demo.features.realTime}
              delay={70}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
              }
              text={t.demo.features.instant}
              delay={90}
            />
          </div>
        </div>

        {/* Right side - WhatsApp phone mockup */}
        <div
          style={{
            opacity: widgetOpacity,
            transform: `translateX(${widgetSlideX}px)`,
          }}
        >
          <WhatsAppPhone
            botName={t.demo.chat.botName}
            onlineText={t.demo.chat.online}
            startFrame={10}
          >
            {/* User message 1 */}
            <WhatsAppChatBubble
              message={t.demo.chat.messages.user1}
              isUser={true}
              startFrame={30}
              typingDuration={35}
            />

            {/* Bot response with services */}
            <WhatsAppChatBubble
              message={t.demo.chat.messages.bot1}
              isUser={false}
              startFrame={80}
              typingDuration={25}
            />

            {/* Service cards */}
            <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
              {t.demo.chat.services.map((service, index) => (
                <WhatsAppServiceCard
                  key={index}
                  name={service.name}
                  price={service.price}
                  icon={service.icon as "scissors" | "brush" | "spa" | "relax"}
                  startFrame={110}
                  delay={index * 15}
                />
              ))}
            </div>

            {/* User message 2 */}
            <WhatsAppChatBubble
              message={t.demo.chat.messages.user2}
              isUser={true}
              startFrame={150}
              typingDuration={35}
            />

            {/* Bot response with time slots */}
            <WhatsAppChatBubble
              message={t.demo.chat.messages.bot2}
              isUser={false}
              startFrame={200}
              typingDuration={25}
            />

            {/* Time slots */}
            <WhatsAppTimeSlots
              times={t.demo.chat.times}
              startFrame={230}
              selectedIndex={0}
            />

            {/* User message 3 */}
            <WhatsAppChatBubble
              message={t.demo.chat.messages.user3}
              isUser={true}
              startFrame={260}
              typingDuration={20}
            />

            {/* Confirmation */}
            <WhatsAppConfirmation
              text={t.demo.chat.confirmation}
              startFrame={280}
            />
          </WhatsAppPhone>
        </div>
      </div>
    </AbsoluteFill>
  );
};
