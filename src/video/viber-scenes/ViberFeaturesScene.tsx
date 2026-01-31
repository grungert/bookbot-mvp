import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { ViberGradientText } from "../viber-components/ViberGradientText";
import { useViberTranslations } from "../viber-translations";
import { viberColors } from "../viberConstants";

// Get gradient color based on grid position (Viber purple gradient)
function getViberGradientColor(index: number): { bg: string; icon: string } {
  const factor = index / 3;
  // Interpolate from primary purple to secondary darker purple
  const r = Math.round(115 + (90 - 115) * factor);
  const g = Math.round(96 + (75 - 96) * factor);
  const b = Math.round(242 + (192 - 242) * factor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
    icon: `rgb(${r}, ${g}, ${b})`,
  };
}

// Feature card component
const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  index: number;
}> = ({ title, description, icon, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradientColors = getViberGradientColor(index);

  const slideProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(slideProgress, [0, 1], [0.5, 1]);

  // Subtle pulse after appearing
  const pulseFrame = frame - delay - 30;
  const pulse = pulseFrame > 0 ? 1 + Math.sin(pulseFrame * 0.1) * 0.02 : 1;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale * pulse})`,
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: 32,
        boxShadow: `0 15px 35px ${viberColors.primary}15`,
        border: "1px solid rgba(255,255,255,0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        width: 280,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: gradientColors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: gradientColors.icon,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 22,
          fontWeight: fontWeights.bold,
          color: colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 16,
          fontWeight: fontWeights.regular,
          color: colors.textLight,
          textAlign: "center",
        }}
      >
        {description}
      </div>
    </div>
  );
};

// Icons
const GlobeIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const ClockIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

const ChatIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
  </svg>
);

const BellIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

export const ViberFeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useViberTranslations();

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

  const features = [
    {
      title: t.features.items.dominance.title,
      description: t.features.items.dominance.description,
      icon: <GlobeIcon />,
      delay: 30,
    },
    {
      title: t.features.items.availability.title,
      description: t.features.items.availability.description,
      icon: <ClockIcon />,
      delay: 45,
    },
    {
      title: t.features.items.conversations.title,
      description: t.features.items.conversations.description,
      icon: <ChatIcon />,
      delay: 60,
    },
    {
      title: t.features.items.reminders.title,
      description: t.features.items.reminders.description,
      icon: <BellIcon />,
      delay: 75,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleSlideY}px)`,
          marginBottom: 60,
        }}
      >
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: 64,
            fontWeight: fontWeights.bold,
            color: colors.text,
            margin: 0,
            textAlign: "center",
          }}
        >
          {t.features.title} <ViberGradientText>{t.features.titleHighlight}</ViberGradientText>
        </h2>
      </div>

      {/* Feature grid - 2x2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 40,
          maxWidth: 700,
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            delay={feature.delay}
            index={index}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
