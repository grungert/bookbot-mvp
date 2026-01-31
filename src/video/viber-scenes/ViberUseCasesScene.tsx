import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { useViberTranslations } from "../viber-translations";
import { viberColors } from "../viberConstants";

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
const DentalIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l1.41 1.41L12 14.83l4.09 4.08 1.41-1.41L12 12l-5.5 5.5zM12 4c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2h2c0-2.21-1.79-4-4-4z" />
  </svg>
);

const FitnessIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
  </svg>
);

const AutoIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

export const ViberUseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useViberTranslations();

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
      icon: <DentalIcon />,
      title: t.useCases.items.dental.title,
      description: t.useCases.items.dental.description,
      delay: 35,
    },
    {
      icon: <FitnessIcon />,
      title: t.useCases.items.fitness.title,
      description: t.useCases.items.fitness.description,
      delay: 42,
    },
    {
      icon: <AutoIcon />,
      title: t.useCases.items.auto.title,
      description: t.useCases.items.auto.description,
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
          background: `linear-gradient(135deg, ${viberColors.primary}80 0%, ${viberColors.secondary}80 100%)`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 32,
          padding: "50px 70px",
          boxShadow: `
            0 30px 60px ${viberColors.primary}40,
            0 20px 40px ${viberColors.secondary}30,
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
