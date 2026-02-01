import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { MobileGradientText } from "../mobile-components/MobileGradientText";
import { useMobileTranslations } from "../mobile-translations";
import { mobileColors } from "../mobileConstants";

// Get gradient color based on grid position (Mobile blue/purple gradient)
function getMobileGradientColor(index: number): { bg: string; icon: string } {
  const factor = index / 3;
  // Interpolate from primary blue to secondary purple
  const r = Math.round(59 + (168 - 59) * factor);
  const g = Math.round(130 + (85 - 130) * factor);
  const b = Math.round(246 + (247 - 246) * factor);

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

  const gradientColors = getMobileGradientColor(index);

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
        boxShadow: `0 15px 35px ${mobileColors.primary}15`,
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
const ResponsiveIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z" />
  </svg>
);

const AlertIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const TapIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.21 0-.59-.34-1.15-.91-1.41z" />
  </svg>
);

const BrowserIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
  </svg>
);

export const MobileFeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useMobileTranslations();

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
      title: t.features.items.responsive.title,
      description: t.features.items.responsive.description,
      icon: <ResponsiveIcon />,
      delay: 30,
    },
    {
      title: t.features.items.alerts.title,
      description: t.features.items.alerts.description,
      icon: <AlertIcon />,
      delay: 45,
    },
    {
      title: t.features.items.quickActions.title,
      description: t.features.items.quickActions.description,
      icon: <TapIcon />,
      delay: 60,
    },
    {
      title: t.features.items.noDownload.title,
      description: t.features.items.noDownload.description,
      icon: <BrowserIcon />,
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
          {t.features.title} <MobileGradientText>{t.features.titleHighlight}</MobileGradientText>
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
