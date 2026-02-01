import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { useMobileTranslations } from "../mobile-translations";
import { mobileColors } from "../mobileConstants";

// Use case item component
const UseCaseItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `scale(${scale})`,
        flex: 1,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 20,
          fontWeight: fontWeights.bold,
          color: "white",
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 15,
          fontWeight: fontWeights.regular,
          color: "rgba(255, 255, 255, 0.8)",
          textAlign: "center",
          maxWidth: 200,
        }}
      >
        {description}
      </div>
    </div>
  );
};

// Icons
const CoffeeIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
  </svg>
);

const TravelIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);

const MoonIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z" />
  </svg>
);

export const MobileUseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useMobileTranslations();

  // Panel animation
  const panelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panelScale = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  // Title animation
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const useCases = [
    {
      icon: <CoffeeIcon />,
      title: t.useCases.items.between.title,
      description: t.useCases.items.between.description,
      delay: 35,
    },
    {
      icon: <TravelIcon />,
      title: t.useCases.items.traveling.title,
      description: t.useCases.items.traveling.description,
      delay: 42,
    },
    {
      icon: <MoonIcon />,
      title: t.useCases.items.afterHours.title,
      description: t.useCases.items.afterHours.description,
      delay: 49,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Gradient panel */}
      <div
        style={{
          opacity: panelOpacity,
          transform: `scale(${panelScale})`,
          background: `linear-gradient(135deg, ${mobileColors.primary}80 0%, ${mobileColors.secondary}80 100%)`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 32,
          padding: "50px 70px",
          boxShadow: `
            0 30px 60px ${mobileColors.primary}40,
            0 20px 40px ${mobileColors.secondary}30,
            inset 0 1px 0 rgba(255, 255, 255, 0.3)
          `,
          border: "1px solid rgba(255, 255, 255, 0.35)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 1000,
          width: "100%",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: 52,
            fontWeight: fontWeights.bold,
            color: "white",
            margin: 0,
            marginBottom: 12,
            textAlign: "center",
            opacity: titleOpacity,
          }}
        >
          {t.useCases.title}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: fonts.primary,
            fontSize: 20,
            fontWeight: fontWeights.regular,
            color: "rgba(255, 255, 255, 0.85)",
            margin: 0,
            marginBottom: 48,
            textAlign: "center",
            opacity: subtitleOpacity,
          }}
        >
          {t.useCases.subtitle}
        </p>

        {/* Use case items row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 48,
            width: "100%",
          }}
        >
          {useCases.map((useCase, index) => (
            <UseCaseItem
              key={index}
              icon={useCase.icon}
              title={useCase.title}
              description={useCase.description}
              delay={useCase.delay}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
