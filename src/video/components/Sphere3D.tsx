import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, shadows } from "../styles/theme";

interface Sphere3DProps {
  size: number;
  x: number;
  y: number;
  color?: "purple" | "blue";
  delay?: number;
  floatAmplitude?: number;
  floatSpeed?: number;
}

export const Sphere3D: React.FC<Sphere3DProps> = ({
  size,
  x,
  y,
  color = "purple",
  delay = 0,
  floatAmplitude = 20,
  floatSpeed = 0.02,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const scaleProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 20, stiffness: 80 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating animation
  const floatY = Math.sin((frame - delay) * floatSpeed) * floatAmplitude;
  const floatX = Math.cos((frame - delay) * floatSpeed * 0.7) * (floatAmplitude * 0.5);

  const gradient =
    color === "purple" ? colors.gradients.sphere : colors.gradients.sphereBlue;
  const shadow = color === "purple" ? shadows.glow : shadows.glowBlue;

  return (
    <div
      style={{
        position: "absolute",
        left: x + floatX,
        top: y + floatY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: gradient,
        opacity,
        transform: `scale(${scaleProgress})`,
        boxShadow: `${shadow}, inset -${size * 0.1}px -${size * 0.1}px ${size * 0.3}px rgba(0,0,0,0.2)`,
      }}
    >
      {/* Highlight */}
      <div
        style={{
          position: "absolute",
          top: size * 0.1,
          left: size * 0.15,
          width: size * 0.3,
          height: size * 0.2,
          borderRadius: "50%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
    </div>
  );
};

// Background with multiple floating spheres
export const SphereBackground: React.FC<{
  variant?: "hero" | "light" | "dark";
}> = ({ variant = "hero" }) => {
  const sphereConfigs = [
    { size: 300, x: -100, y: 200, color: "purple" as const, delay: 0 },
    { size: 200, x: 1700, y: 100, color: "blue" as const, delay: 10 },
    { size: 150, x: 100, y: 700, color: "blue" as const, delay: 20 },
    { size: 250, x: 1500, y: 600, color: "purple" as const, delay: 15 },
    { size: 100, x: 800, y: 50, color: "purple" as const, delay: 25 },
    { size: 120, x: 1200, y: 800, color: "blue" as const, delay: 30 },
  ];

  const bgColor =
    variant === "dark"
      ? colors.backgroundDark
      : variant === "light"
        ? colors.background
        : colors.backgroundDark;

  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        overflow: "hidden",
      }}
    >
      {sphereConfigs.map((config, i) => (
        <Sphere3D
          key={i}
          size={config.size}
          x={config.x}
          y={config.y}
          color={config.color}
          delay={config.delay}
          floatAmplitude={15 + i * 5}
          floatSpeed={0.015 + i * 0.003}
        />
      ))}
    </AbsoluteFill>
  );
};

// Small decorative spheres for accents
export const MiniSphere: React.FC<{
  size?: number;
  color?: string;
  x: number;
  y: number;
  delay?: number;
}> = ({ size = 20, color = colors.primary, x, y, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - delay,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        transform: `scale(${scale})`,
        boxShadow: `0 0 ${size}px ${color}40`,
      }}
    />
  );
};
