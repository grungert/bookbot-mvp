import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import { useChatbotTranslations } from "../chatbot-translations";

// Floating badge component
const FloatingBadge: React.FC<{
  text: string;
  icon: React.ReactNode;
  delay: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
  color: string;
}> = ({ text, icon, delay, position, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 80 },
  });

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const floatY = Math.sin((frame - delay) * 0.08) * 6;

  return (
    <div
      style={{
        position: "absolute",
        ...position,
        opacity,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255, 255, 255, 0.95)",
        padding: "12px 20px",
        borderRadius: 50,
        boxShadow: `0 8px 32px ${color}30, 0 4px 12px rgba(0,0,0,0.08)`,
        border: `2px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: fonts.primary,
          fontSize: 16,
          fontWeight: fontWeights.semibold,
          color: colors.text,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Mini chat widget preview
const MiniChatWidget: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 80 },
  });

  const opacity = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideX = interpolate(slideProgress, [0, 1], [100, 0]);
  const floatY = Math.sin(frame * 0.05) * 4;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slideX}px) translateY(${floatY}px)`,
        width: 280,
        height: 200,
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        padding: 16,
        boxShadow: `
          0 20px 40px rgba(59, 130, 246, 0.2),
          0 10px 20px rgba(168, 85, 247, 0.15)
        `,
        border: "1px solid rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
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
          <div style={{ fontFamily: fonts.primary, fontSize: 13, fontWeight: fontWeights.semibold, color: colors.text }}>
            AI Assistant
          </div>
          <div style={{ fontFamily: fonts.primary, fontSize: 10, color: colors.success }}>
            Online
          </div>
        </div>
      </div>

      {/* Chat bubbles preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            alignSelf: "flex-start",
            background: "rgba(59, 130, 246, 0.1)",
            padding: "8px 12px",
            borderRadius: 12,
            fontFamily: fonts.primary,
            fontSize: 12,
            color: colors.text,
          }}
        >
          How can I help you today?
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            background: colors.gradients.blueToPurple,
            padding: "8px 12px",
            borderRadius: 12,
            fontFamily: fonts.primary,
            fontSize: 12,
            color: "white",
          }}
        >
          I'd like to book an appointment
        </div>
      </div>
    </div>
  );
};

export const ChatbotHeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useChatbotTranslations();

  // Badge animation
  const badgeOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeScale = spring({
    fps,
    frame,
    config: { damping: 12, stiffness: 100 },
  });

  // Headline animation
  const headlineOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineY = spring({
    fps,
    frame: frame - 5,
    config: { damping: 15, stiffness: 80 },
  });

  const headlineSlideY = interpolate(headlineY, [0, 1], [50, 0]);

  // Subheadline animation
  const subheadlineOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subheadlineY = spring({
    fps,
    frame: frame - 25,
    config: { damping: 15, stiffness: 80 },
  });

  const subheadlineSlideY = interpolate(subheadlineY, [0, 1], [30, 0]);

  // CTA button animation
  const ctaOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScale = spring({
    fps,
    frame: frame - 50,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating badges */}
      <FloatingBadge
        text={t.hero.badges.support}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        }
        delay={60}
        position={{ top: 180, right: 180 }}
        color="#3b82f6"
      />

      <FloatingBadge
        text={t.hero.badges.noForms}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 17h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V7H7v2z" />
          </svg>
        }
        delay={75}
        position={{ top: 280, left: 140 }}
        color="#7c3aed"
      />

      <FloatingBadge
        text={t.hero.badges.instant}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
        }
        delay={90}
        position={{ bottom: 200, right: 200 }}
        color="#10b981"
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 80,
          maxWidth: 1400,
          padding: "0 80px",
        }}
      >
        {/* Left side - Text content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Badge */}
          <div
            style={{
              opacity: badgeOpacity,
              transform: `scale(${badgeScale})`,
              alignSelf: "flex-start",
            }}
          >
            <div
              style={{
                background: colors.gradients.blueToPurple,
                padding: "8px 20px",
                borderRadius: 50,
                fontFamily: fonts.primary,
                fontSize: 14,
                fontWeight: fontWeights.semibold,
                color: "white",
              }}
            >
              {t.hero.badge}
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              opacity: headlineOpacity,
              transform: `translateY(${headlineSlideY}px)`,
            }}
          >
            <h1
              style={{
                fontFamily: fonts.heading,
                fontSize: 82,
                fontWeight: fontWeights.extrabold,
                color: colors.text,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {t.hero.headline1}{" "}
              <GradientText>{t.hero.headline2}</GradientText>
            </h1>
          </div>

          {/* Subheadline */}
          <div
            style={{
              opacity: subheadlineOpacity,
              transform: `translateY(${subheadlineSlideY}px)`,
            }}
          >
            <p
              style={{
                fontFamily: fonts.primary,
                fontSize: 28,
                fontWeight: fontWeights.medium,
                color: colors.textLight,
                margin: 0,
                maxWidth: 550,
                lineHeight: 1.5,
              }}
            >
              {t.hero.subheadline}
            </p>
          </div>

          {/* CTA Button */}
          <div
            style={{
              marginTop: 16,
              opacity: ctaOpacity,
              transform: `scale(${ctaScale})`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: colors.gradients.blueToPurple,
                padding: "18px 36px",
                borderRadius: borderRadius.full,
                boxShadow: `0 8px 32px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(124, 58, 237, 0.3)`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.primary,
                  fontSize: 22,
                  fontWeight: fontWeights.semibold,
                  color: "white",
                }}
              >
                {t.hero.cta}
              </span>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right side - Mini chat widget */}
        <MiniChatWidget delay={80} />
      </div>
    </AbsoluteFill>
  );
};
