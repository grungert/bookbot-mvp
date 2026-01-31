import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius } from "../styles/theme";
import { ViberGradientText } from "../viber-components/ViberGradientText";
import { useViberTranslations } from "../viber-translations";
import { viberColors } from "../viberConstants";

// Floating badge component
const FloatingBadge: React.FC<{
  text: string;
  icon: React.ReactNode;
  delay: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}> = ({ text, icon, delay, position }) => {
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
        boxShadow: `0 8px 32px ${viberColors.primary}30, 0 4px 12px rgba(0,0,0,0.08)`,
        border: `2px solid ${viberColors.primary}30`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `${viberColors.primary}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: viberColors.primary,
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

// Mini Viber widget preview
const MiniViberWidget: React.FC<{ delay: number }> = ({ delay }) => {
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
          0 20px 40px ${viberColors.primary}25,
          0 10px 20px ${viberColors.secondary}20
        `,
        border: `1px solid ${viberColors.primary}20`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${viberColors.primary} 0%, ${viberColors.secondary} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: fonts.primary, fontSize: 13, fontWeight: fontWeights.semibold, color: colors.text }}>
            BookBot Assistant
          </div>
          <div style={{ fontFamily: fonts.primary, fontSize: 10, color: viberColors.primary }}>
            Online
          </div>
        </div>
      </div>

      {/* Chat bubbles preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            alignSelf: "flex-start",
            background: "white",
            padding: "8px 12px",
            borderRadius: 12,
            fontFamily: fonts.primary,
            fontSize: 12,
            color: colors.text,
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          How can I help you today?
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            background: viberColors.light,
            padding: "8px 12px",
            borderRadius: 12,
            fontFamily: fonts.primary,
            fontSize: 12,
            color: colors.text,
          }}
        >
          I'd like to book an appointment
        </div>
      </div>
    </div>
  );
};

export const ViberHeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useViberTranslations();

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
        text={t.hero.badges.available}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        }
        delay={60}
        position={{ top: 180, right: 180 }}
      />

      <FloatingBadge
        text={t.hero.badges.users}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        }
        delay={75}
        position={{ top: 280, left: 140 }}
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
                background: `linear-gradient(135deg, ${viberColors.primary}dd 0%, ${viberColors.secondary}dd 100%)`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "8px 20px",
                borderRadius: 50,
                fontFamily: fonts.primary,
                fontSize: 14,
                fontWeight: fontWeights.semibold,
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: `0 4px 16px ${viberColors.primary}40`,
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
              <ViberGradientText>{t.hero.headline2}</ViberGradientText>
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
                background: `linear-gradient(135deg, ${viberColors.primary}ee 0%, ${viberColors.secondary}ee 100%)`,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                padding: "18px 36px",
                borderRadius: borderRadius.full,
                boxShadow: `0 8px 32px ${viberColors.primary}40, 0 4px 12px ${viberColors.secondary}30`,
                border: "1px solid rgba(255, 255, 255, 0.25)",
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

        {/* Right side - Mini Viber widget */}
        <MiniViberWidget delay={80} />
      </div>
    </AbsoluteFill>
  );
};
