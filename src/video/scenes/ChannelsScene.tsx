import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius, shadows } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import {
  WhatsAppIcon,
  ViberIcon,
  WidgetIcon,
  MobileIcon,
} from "../components/FeatureCard";
import { useTranslations } from "../translations";

interface ChannelCardProps {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
  isNew?: boolean;
  isGradient?: boolean;
  newBadgeText?: string;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  name,
  tagline,
  icon,
  color,
  delay,
  isNew = false,
  isGradient = false,
  newBadgeText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideY = interpolate(slideProgress, [0, 1], [60, 0]);
  const scale = interpolate(slideProgress, [0, 1], [0.8, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px) scale(${scale})`,
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: borderRadius.xxl,
        padding: 32,
        boxShadow: `
          0 15px 35px -5px rgba(59, 130, 246, 0.15),
          0 10px 20px -5px rgba(168, 85, 247, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.9)
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        width: 200,
        position: "relative",
        border: "1px solid rgba(255, 255, 255, 0.8)",
      }}
    >
      {isNew && newBadgeText && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            background: colors.channelColors.viber,
            color: colors.textInverse,
            fontFamily: fonts.primary,
            fontSize: 11,
            fontWeight: fontWeights.bold,
            padding: "4px 10px",
            borderRadius: borderRadius.full,
            boxShadow: shadows.md,
          }}
        >
          {newBadgeText}
        </div>
      )}

      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: borderRadius.xl,
          background: isGradient ? colors.gradients.mobile : `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isGradient ? colors.textInverse : color,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: 20,
          fontWeight: fontWeights.bold,
          color: colors.text,
          textAlign: "center",
        }}
      >
        {name}
      </div>

      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 13,
          fontWeight: fontWeights.medium,
          color: colors.textLight,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {tagline}
      </div>
    </div>
  );
};

export const ChannelsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslations();

  const titleOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const channels = [
    {
      name: t.channels.whatsapp.name,
      tagline: t.channels.whatsapp.tagline,
      icon: <WhatsAppIcon size={40} />,
      color: colors.channelColors.whatsapp,
      delay: 30,
    },
    {
      name: t.channels.viber.name,
      tagline: t.channels.viber.tagline,
      icon: <ViberIcon size={40} />,
      color: colors.channelColors.viber,
      delay: 45,
      isNew: true,
    },
    {
      name: t.channels.website.name,
      tagline: t.channels.website.tagline,
      icon: <WidgetIcon size={40} />,
      color: colors.primary,
      delay: 60,
      isGradient: true,
    },
    {
      name: t.channels.mobile.name,
      tagline: t.channels.mobile.tagline,
      icon: <MobileIcon size={40} />,
      color: colors.primary,
      delay: 75,
      isGradient: true,
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
          {t.channels.title} <GradientText>{t.channels.titleHighlight}</GradientText>
        </h2>
      </div>

      {/* Channel cards row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 32,
        }}
      >
        {channels.map((channel, index) => (
          <ChannelCard
            key={index}
            name={channel.name}
            tagline={channel.tagline}
            icon={channel.icon}
            color={channel.color}
            delay={channel.delay}
            isNew={channel.isNew}
            isGradient={channel.isGradient}
            newBadgeText={t.channels.newBadge}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
