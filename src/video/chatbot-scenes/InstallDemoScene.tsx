import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights } from "../styles/theme";
import { GradientText } from "../components/AnimatedBackground";
import { CodeSnippet } from "../chatbot-components/CodeSnippet";
import { PlatformLogos } from "../chatbot-components/PlatformLogos";
import { useChatbotTranslations } from "../chatbot-translations";

export const InstallDemoScene: React.FC = () => {
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

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = spring({
    fps,
    frame: frame - 15,
    config: { damping: 15, stiffness: 80 },
  });

  const subtitleSlideY = interpolate(subtitleY, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          maxWidth: 1000,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlideY}px)`,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 64,
              fontWeight: fontWeights.bold,
              color: colors.text,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {t.installDemo.title}{" "}
            <GradientText>{t.installDemo.titleHighlight}</GradientText>
          </h2>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleSlideY}px)`,
          }}
        >
          <p
            style={{
              fontFamily: fonts.primary,
              fontSize: 24,
              fontWeight: fontWeights.medium,
              color: colors.textLight,
              margin: 0,
              textAlign: "center",
            }}
          >
            {t.installDemo.subtitle}
          </p>
        </div>

        {/* Code snippet */}
        <CodeSnippet
          code={t.installDemo.code}
          startFrame={20}
          typingDuration={60}
          showCopied={true}
          copiedStartFrame={100}
        />

        {/* Platform logos */}
        <PlatformLogos
          startFrame={80}
          labels={t.installDemo.platforms}
        />
      </div>
    </AbsoluteFill>
  );
};
