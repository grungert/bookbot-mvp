import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius } from "../styles/theme";
import { AnimatedBookBotLogo } from "../components/BookBotLogo";
import { GradientText } from "../components/AnimatedBackground";
import { useTranslations } from "../translations";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslations();

  // Headline animation
  const headlineOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  // Logo animation
  const logoOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoScale = spring({
    fps,
    frame: frame - 20,
    config: { damping: 12, stiffness: 80 },
  });

  // CTA button animation
  const ctaOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScale = spring({
    fps,
    frame: frame - 50,
    config: { damping: 12, stiffness: 80 },
  });

  // URL animation
  const urlOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlY = spring({
    fps,
    frame: frame - 90,
    config: { damping: 15, stiffness: 80 },
  });

  // Button pulse effect
  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.03;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          marginLeft: 80,
        }}
      >
        {/* Headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${interpolate(headlineY, [0, 1], [40, 0])}px)`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: 56,
              fontWeight: fontWeights.bold,
              color: colors.text,
              margin: 0,
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            {t.cta.line1}
          </h1>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: 56,
              fontWeight: fontWeights.bold,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            <GradientText>{t.cta.line2}</GradientText>
          </h1>
        </div>

        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            marginTop: 10,
          }}
        >
          <AnimatedBookBotLogo delay={20} />
        </div>

        {/* CTA Button with gradient glow */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale * pulseScale})`,
            marginTop: 10,
          }}
        >
          <div
            style={{
              padding: "22px 56px",
              borderRadius: borderRadius.full,
              background: "linear-gradient(to right, #3b82f6, #a855f7)",
              boxShadow: `
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04),
                0 0 30px rgba(59, 130, 246, 0.5),
                0 0 30px rgba(168, 85, 247, 0.4)
              `,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: fonts.heading,
                fontSize: 28,
                fontWeight: fontWeights.bold,
                color: colors.textInverse,
                letterSpacing: "0.02em",
              }}
            >
              {t.cta.button}
            </span>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            opacity: urlOpacity,
            transform: `translateY(${interpolate(urlY, [0, 1], [20, 0])}px)`,
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: fonts.primary,
              fontSize: 24,
              fontWeight: fontWeights.medium,
              color: colors.textLight,
            }}
          >
            {t.cta.url}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
