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
import { ViberGradientText } from "../viber-components/ViberGradientText";
import { useViberTranslations } from "../viber-translations";
import { viberColors } from "../viberConstants";

export const ViberCTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useViberTranslations();

  // Headline line 1 animation
  const headline1Opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headline1Y = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const headline1SlideY = interpolate(headline1Y, [0, 1], [40, 0]);

  // Headline line 2 animation
  const headline2Opacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headline2Y = spring({
    fps,
    frame: frame - 10,
    config: { damping: 15, stiffness: 80 },
  });

  const headline2SlideY = interpolate(headline2Y, [0, 1], [40, 0]);

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

  const urlSlideY = interpolate(urlY, [0, 1], [20, 0]);

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
        }}
      >
        {/* Headline */}
        <div style={{ textAlign: "center" }}>
          {/* Line 1 */}
          <div
            style={{
              opacity: headline1Opacity,
              transform: `translateY(${headline1SlideY}px)`,
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
          </div>

          {/* Line 2 */}
          <div
            style={{
              opacity: headline2Opacity,
              transform: `translateY(${headline2SlideY}px)`,
            }}
          >
            <h1
              style={{
                fontFamily: fonts.heading,
                fontSize: 56,
                fontWeight: fontWeights.bold,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              <ViberGradientText>{t.cta.line2}</ViberGradientText>
            </h1>
          </div>
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

        {/* CTA Button with Viber purple glow */}
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
              background: `linear-gradient(135deg, ${viberColors.primary}ee 0%, ${viberColors.secondary}ee 100%)`,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: `
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04),
                0 0 30px ${viberColors.primary}60,
                0 0 30px ${viberColors.secondary}50
              `,
              border: "1px solid rgba(255, 255, 255, 0.25)",
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
            transform: `translateY(${urlSlideY}px)`,
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
