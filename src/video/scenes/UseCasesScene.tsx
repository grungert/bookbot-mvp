import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import {
  SalonIcon,
  ClinicIcon,
  FitnessIcon,
  BeautyIcon,
  ConsultantIcon,
  PhotographerIcon,
} from "../components/FeatureCard";
import { useTranslations } from "../translations";

// Industry icon component for this scene
const IndustryIcon: React.FC<{
  name: string;
  icon: React.ReactNode;
  delay: number;
}> = ({ name, icon, delay }) => {
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

  const scale = interpolate(progress, [0, 1], [0.5, 1]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: 18,
          background: "rgba(255, 255, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: fonts.primary,
          fontSize: 15,
          fontWeight: fontWeights.medium,
          color: "white",
        }}
      >
        {name}
      </span>
    </div>
  );
};

export const UseCasesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslations();

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

  const industries = [
    { name: t.useCases.industries.salons, icon: <SalonIcon size={40} />, delay: 15 },
    { name: t.useCases.industries.clinics, icon: <ClinicIcon size={40} />, delay: 22 },
    { name: t.useCases.industries.fitness, icon: <FitnessIcon size={40} />, delay: 29 },
    { name: t.useCases.industries.beauty, icon: <BeautyIcon size={40} />, delay: 36 },
    { name: t.useCases.industries.consultants, icon: <ConsultantIcon size={40} />, delay: 43 },
    { name: t.useCases.industries.photographers, icon: <PhotographerIcon size={40} />, delay: 50 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Glass panel with gradient */}
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
            0 30px 60px -15px rgba(59, 130, 246, 0.4),
            0 20px 40px -10px rgba(124, 58, 237, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
          border: "1px solid rgba(255, 255, 255, 0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginLeft: 100,
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
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          {t.useCases.subtitle}
        </p>

        {/* Industry icons row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 32,
          }}
        >
          {industries.map((industry, index) => (
            <IndustryIcon
              key={index}
              name={industry.name}
              icon={industry.icon}
              delay={industry.delay}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
