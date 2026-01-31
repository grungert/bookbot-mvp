import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius } from "../styles/theme";
import { WhatsAppGradientText } from "../whatsapp-components/WhatsAppGradientText";
import { useWhatsAppTranslations } from "../whatsapp-translations";
import { whatsappColors } from "../whatsappConstants";

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
        boxShadow: `0 8px 32px ${whatsappColors.primary}30, 0 4px 12px rgba(0,0,0,0.08)`,
        border: `2px solid ${whatsappColors.primary}30`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `${whatsappColors.primary}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: whatsappColors.primary,
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

// Mini WhatsApp widget preview
const MiniWhatsAppWidget: React.FC<{ delay: number }> = ({ delay }) => {
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
          0 20px 40px ${whatsappColors.primary}25,
          0 10px 20px ${whatsappColors.secondary}20
        `,
        border: `1px solid ${whatsappColors.primary}20`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${whatsappColors.primary} 0%, ${whatsappColors.secondary} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: fonts.primary, fontSize: 13, fontWeight: fontWeights.semibold, color: colors.text }}>
            BookBot Assistant
          </div>
          <div style={{ fontFamily: fonts.primary, fontSize: 10, color: whatsappColors.primary }}>
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
            background: whatsappColors.light,
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

export const WhatsAppHeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useWhatsAppTranslations();

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
            <path d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24a5.98 5.98 0 010 7.52c.42.14.86.24 1.33.24zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM9 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
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
                background: `linear-gradient(135deg, ${whatsappColors.primary}dd 0%, ${whatsappColors.secondary}dd 100%)`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "8px 20px",
                borderRadius: 50,
                fontFamily: fonts.primary,
                fontSize: 14,
                fontWeight: fontWeights.semibold,
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: `0 4px 16px ${whatsappColors.primary}40`,
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
              <WhatsAppGradientText>{t.hero.headline2}</WhatsAppGradientText>
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
                background: `linear-gradient(135deg, ${whatsappColors.primary}ee 0%, ${whatsappColors.secondary}ee 100%)`,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                padding: "18px 36px",
                borderRadius: borderRadius.full,
                boxShadow: `0 8px 32px ${whatsappColors.primary}40, 0 4px 12px ${whatsappColors.secondary}30`,
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

        {/* Right side - Mini WhatsApp widget */}
        <MiniWhatsAppWidget delay={80} />
      </div>
    </AbsoluteFill>
  );
};
