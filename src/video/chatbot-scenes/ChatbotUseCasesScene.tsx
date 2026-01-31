import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { useChatbotTranslations } from "../chatbot-translations";

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
          background: "rgba(255, 255, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
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
const MoonClockIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.01 12c0-3.57 2.2-6.62 5.31-7.87.89-.36.75-1.69-.19-1.9-1.1-.24-2.27-.24-3.45.04C9.08 3.22 5.76 7.01 6.04 11.8c.29 5.01 4.52 9.01 9.53 9.01.95 0 1.87-.14 2.75-.39.94-.26 1.08-1.53.19-1.9-3.11-1.25-5.5-4.3-5.5-6.52zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c.34 0 .68.02 1.01.07-.56 1.4-.88 2.91-.88 4.51 0 3.46 2.03 6.44 4.95 7.89-1.4.98-3.11 1.53-4.95 1.53h-.13z" />
  </svg>
);

const FilterIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
  </svg>
);

const LightningIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2v11h3v9l7-12h-4l4-8z" />
  </svg>
);

export const ChatbotUseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useChatbotTranslations();

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
      icon: <MoonClockIcon />,
      title: t.useCases.items.afterHours.title,
      description: t.useCases.items.afterHours.description,
      delay: 35,
    },
    {
      icon: <FilterIcon />,
      title: t.useCases.items.leads.title,
      description: t.useCases.items.leads.description,
      delay: 42,
    },
    {
      icon: <LightningIcon />,
      title: t.useCases.items.answers.title,
      description: t.useCases.items.answers.description,
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
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 32,
          padding: "50px 70px",
          boxShadow: `
            0 30px 60px rgba(59, 130, 246, 0.4),
            0 20px 40px rgba(124, 58, 237, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
          border: "1px solid rgba(255, 255, 255, 0.25)",
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
