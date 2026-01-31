import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { useWhatsAppTranslations } from "../whatsapp-translations";
import { whatsappColors } from "../whatsappConstants";

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
const SpaIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.49 9.63c-.18-2.79-1.31-5.51-3.43-7.63a12.188 12.188 0 00-3.55 7.63c1.28.68 2.46 1.56 3.49 2.63 1.03-1.06 2.21-1.94 3.49-2.63zm-6.5 2.65c-.14-.1-.3-.19-.45-.29-.28.27-.57.54-.88.79l.18.13c.16.11.37.07.48-.09.1-.14.11-.32.04-.47l.63-.07zM12 15.45C9.85 12.17 6.18 10 2 10c0 5.32 3.36 9.82 8.03 11.49.63.23 1.29.4 1.97.51.68-.12 1.34-.29 1.97-.51C18.64 19.82 22 15.32 22 10c-4.18 0-7.85 2.17-10 5.45z" />
  </svg>
);

const MedicalIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
  </svg>
);

const GlobeIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

export const WhatsAppUseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useWhatsAppTranslations();

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
      icon: <SpaIcon />,
      title: t.useCases.items.salons.title,
      description: t.useCases.items.salons.description,
      delay: 35,
    },
    {
      icon: <MedicalIcon />,
      title: t.useCases.items.clinics.title,
      description: t.useCases.items.clinics.description,
      delay: 42,
    },
    {
      icon: <GlobeIcon />,
      title: t.useCases.items.consultants.title,
      description: t.useCases.items.consultants.description,
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
          background: `linear-gradient(135deg, ${whatsappColors.primary}80 0%, ${whatsappColors.secondary}80 100%)`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 32,
          padding: "50px 70px",
          boxShadow: `
            0 30px 60px ${whatsappColors.primary}40,
            0 20px 40px ${whatsappColors.secondary}30,
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
