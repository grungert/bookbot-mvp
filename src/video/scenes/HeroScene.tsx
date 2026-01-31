import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, shadows } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import { useTranslations } from "../translations";

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

export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslations();

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

  // Tagline animation
  const taglineOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = spring({
    fps,
    frame: frame - 25,
    config: { damping: 15, stiffness: 80 },
  });

  const taglineSlideY = interpolate(taglineY, [0, 1], [30, 0]);

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
        text={t.hero.badges.aiSupport}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        }
        delay={60}
        position={{ top: 180, right: 180 }}
        color="#3b82f6"
      />

      <FloatingBadge
        text={t.hero.badges.multiChannel}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 11V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z" />
          </svg>
        }
        delay={75}
        position={{ top: 280, left: 140 }}
        color="#7c3aed"
      />

      <FloatingBadge
        text={t.hero.badges.smartScheduling}
        icon={
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
        }
        delay={90}
        position={{ bottom: 200, right: 200 }}
        color="#10b981"
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          maxWidth: 1000,
          padding: "0 60px",
          marginLeft: 120,
        }}
      >
        {/* Main headline */}
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
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {t.hero.headline1}{" "}
            <GradientText>
              {t.hero.headline2}
            </GradientText>
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineSlideY}px)`,
          }}
        >
          <p
            style={{
              fontFamily: fonts.primary,
              fontSize: 28,
              fontWeight: fontWeights.medium,
              color: colors.textLight,
              textAlign: "center",
              margin: 0,
              maxWidth: 700,
            }}
          >
            {t.hero.tagline}
          </p>
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 20,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
              padding: "18px 36px",
              borderRadius: 50,
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
    </AbsoluteFill>
  );
};
