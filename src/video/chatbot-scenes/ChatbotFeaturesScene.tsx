import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius, getIconGradientColor } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import { useChatbotTranslations } from "../chatbot-translations";

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

  const gradientColors = getIconGradientColor(index, 2);

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
        boxShadow: "0 15px 35px rgba(59,130,246,0.15)",
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
const CodeIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
  </svg>
);

const PaletteIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.49 2 2 6.49 2 12c0 5.51 4.49 10 10 10 .83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

const BrainIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.33 12.91c.09 1.55-.62 3.04-1.89 3.95l.77 1.49c.23.45.26.98.06 1.45-.19.47-.58.84-1.06 1l-.79.25a1.687 1.687 0 01-1.81-.55l-.89-1.14c-.48.06-.97.1-1.46.1-3.13 0-5.98-1.53-7.73-4.02-.2.26-.42.51-.67.74-.71.65-1.59 1.07-2.53 1.21-.35.05-.7.08-1.05.08-1.45 0-2.78-.55-3.78-1.55C.38 13.96 0 12.63 0 11.18c0-1.45.38-2.78 1.51-3.78 1-1 2.33-1.55 3.78-1.55.35 0 .7.03 1.05.08.94.14 1.82.56 2.53 1.21.25.23.47.48.67.74 1.75-2.49 4.6-4.02 7.73-4.02.49 0 .98.04 1.46.1l.89-1.14c.41-.52 1.02-.79 1.65-.79.21 0 .42.03.63.09l.79.25c.48.16.87.53 1.06 1 .2.47.17 1-.06 1.45l-.77 1.49c1.27.91 1.98 2.4 1.89 3.95-.04.58-.19 1.15-.43 1.67l.85.85c.35.35.54.82.54 1.31 0 .49-.19.96-.54 1.31l-.97.97c-.35.35-.82.54-1.31.54-.49 0-.96-.19-1.31-.54l-.85-.85c-.52.24-1.09.39-1.67.43z" />
  </svg>
);

const ClockIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

export const ChatbotFeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useChatbotTranslations();

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
      title: t.features.items.install.title,
      description: t.features.items.install.description,
      icon: <CodeIcon />,
      delay: 30,
    },
    {
      title: t.features.items.brand.title,
      description: t.features.items.brand.description,
      icon: <PaletteIcon />,
      delay: 45,
    },
    {
      title: t.features.items.knowledge.title,
      description: t.features.items.knowledge.description,
      icon: <BrainIcon />,
      delay: 60,
    },
    {
      title: t.features.items.available.title,
      description: t.features.items.available.description,
      icon: <ClockIcon />,
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
          {t.features.title} <GradientText>{t.features.titleHighlight}</GradientText>
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
