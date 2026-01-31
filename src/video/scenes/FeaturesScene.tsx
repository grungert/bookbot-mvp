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
  FeatureCard,
  CalendarIcon,
  ChatIcon,
  InvoiceIcon,
  TagIcon,
  ChannelsIcon,
  PaletteIcon,
} from "../components/FeatureCard";
import { GradientText } from "../components/AnimatedBackground";
import { useTranslations } from "../translations";

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslations();

  // Scene title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const features = [
    {
      title: t.features.items.booking,
      icon: <CalendarIcon size={40} />,
      color: colors.primary,
      delay: 30,
    },
    {
      title: t.features.items.ai,
      icon: <ChatIcon size={40} />,
      color: colors.accent,
      delay: 45,
    },
    {
      title: t.features.items.invoicing,
      icon: <InvoiceIcon size={40} />,
      color: colors.success,
      delay: 60,
    },
    {
      title: t.features.items.discounts,
      icon: <TagIcon size={40} />,
      color: colors.warning,
      delay: 75,
    },
    {
      title: t.features.items.channels,
      icon: <ChannelsIcon size={40} />,
      color: colors.accent,
      delay: 90,
    },
    {
      title: t.features.items.branding,
      icon: <PaletteIcon size={40} />,
      color: colors.primary,
      delay: 105,
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
          transform: `translateY(${interpolate(titleY, [0, 1], [40, 0])}px)`,
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
          {t.features.title} <GradientText>{t.features.titleHighlight}</GradientText>
        </h2>
      </div>

      {/* Feature grid - 2 rows x 3 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 40,
          maxWidth: 1200,
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            icon={feature.icon}
            delay={feature.delay}
            index={index}
            useGradientColor={true}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
