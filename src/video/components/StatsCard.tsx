import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, fontWeights, borderRadius, shadows, getLinearGradientColor } from "../styles/theme";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  delay?: number;
  index?: number; // Position for gradient color calculation
  total?: number; // Total number of cards
  useGradientColor?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = "positive",
  icon,
  delay = 0,
  index = 0,
  total = 4,
  useGradientColor = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate gradient color if enabled
  const gradientColors = useGradientColor ? getLinearGradientColor(index, total) : null;
  const iconColor = gradientColors ? gradientColors.icon : colors.primary;
  const iconBg = gradientColors ? gradientColors.bg : `${colors.primary}15`;

  const slideProgress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideY = interpolate(slideProgress, [0, 1], [40, 0]);

  // Animate the number counting up
  const valueNum = typeof value === "number" ? value : parseFloat(value.replace(/[^0-9.]/g, ""));
  const valuePrefix = typeof value === "string" ? value.match(/^[^0-9]*/)?.[0] || "" : "";
  const valueSuffix = typeof value === "string" ? value.match(/[^0-9]*$/)?.[0] || "" : "";

  const countProgress = interpolate(frame - delay, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const displayValue = !isNaN(valueNum)
    ? `${valuePrefix}${Math.floor(valueNum * countProgress).toLocaleString()}${valueSuffix}`
    : value;

  const changeColor =
    changeType === "positive"
      ? colors.success
      : changeType === "negative"
        ? colors.error
        : colors.textLight;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        background: colors.surface,
        borderRadius: borderRadius.xl,
        padding: 28,
        // Use new glass card shadow with blue/purple accents
        boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)",
        minWidth: 240,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: fonts.primary,
            fontSize: 16,
            fontWeight: fontWeights.medium,
            color: colors.textLight,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: borderRadius.lg,
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: 40,
          fontWeight: fontWeights.bold,
          color: colors.text,
          marginBottom: change ? 8 : 0,
        }}
      >
        {displayValue}
      </div>

      {change && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill={changeColor}
            style={{
              transform: changeType === "negative" ? "rotate(180deg)" : "none",
            }}
          >
            <path d="M12 4 L20 14 L15 14 L15 20 L9 20 L9 14 L4 14 Z" />
          </svg>
          <span
            style={{
              fontFamily: fonts.primary,
              fontSize: 14,
              fontWeight: fontWeights.medium,
              color: changeColor,
            }}
          >
            {change}
          </span>
        </div>
      )}
    </div>
  );
};

// Revenue Chart with animated line
export const RevenueChart: React.FC<{
  delay?: number;
}> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = interpolate(frame - delay, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sample data points
  const data = [30, 45, 35, 55, 50, 70, 65, 85];
  const width = 600;
  const height = 180;
  const padding = 20;

  const points = data.map((value, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - (value / 100) * (height - padding * 2),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div
      style={{
        opacity,
        background: colors.surface,
        borderRadius: borderRadius.xl,
        padding: 24,
        boxShadow: shadows.lg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 18,
          fontWeight: fontWeights.semibold,
          color: colors.text,
          marginBottom: 16,
        }}
      >
        Revenue Overview
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ flex: 1 }}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i / 4) * (height - padding * 2)}
            x2={width - padding}
            y2={padding + (i / 4) * (height - padding * 2)}
            stroke={colors.textLight}
            strokeOpacity={0.1}
          />
        ))}

        {/* Area fill */}
        <path
          d={areaD}
          fill={`url(#gradient-${delay})`}
          opacity={0.3}
          style={{
            clipPath: `inset(0 ${100 - drawProgress * 100}% 0 0)`,
          }}
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1000}
          strokeDashoffset={1000 * (1 - drawProgress)}
        />

        {/* Data points */}
        {points.map((p, i) => {
          const pointDelay = delay + i * 5;
          const pointScale = spring({
            fps,
            frame: frame - pointDelay,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={6 * pointScale}
              fill={colors.surface}
              stroke={colors.primary}
              strokeWidth={3}
            />
          );
        })}

        <defs>
          <linearGradient
            id={`gradient-${delay}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Donut chart for bookings distribution
export const DonutChart: React.FC<{
  delay?: number;
}> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const fillProgress = interpolate(frame - delay, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const segments = [
    { value: 45, color: colors.primary, label: "Haircut" },
    { value: 25, color: colors.accent, label: "Coloring" },
    { value: 20, color: colors.success, label: "Styling" },
    { value: 10, color: colors.warning, label: "Other" },
  ];

  const size = 180;
  const strokeWidth = 35;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div
      style={{
        opacity,
        background: colors.surface,
        borderRadius: borderRadius.xl,
        padding: 24,
        boxShadow: shadows.lg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: fonts.primary,
          fontSize: 18,
          fontWeight: fontWeights.semibold,
          color: colors.text,
          marginBottom: 16,
        }}
      >
        Services Distribution
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flex: 1 }}>
        <svg width={size} height={size}>
          {segments.map((seg, i) => {
            const segmentLength = (seg.value / 100) * circumference;
            const currentOffset = offset;
            offset += segmentLength;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength * fillProgress} ${circumference}`}
                strokeDashoffset={-currentOffset * fillProgress}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: seg.color,
                }}
              />
              <span
                style={{
                  fontFamily: fonts.primary,
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {seg.label}
              </span>
              <span
                style={{
                  fontFamily: fonts.primary,
                  fontSize: 14,
                  fontWeight: fontWeights.semibold,
                  color: colors.textLight,
                }}
              >
                {seg.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Notification badge with pulse
export const NotificationBadge: React.FC<{
  count: number;
  delay?: number;
}> = ({ count, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - delay,
    config: { damping: 10, stiffness: 120 },
  });

  const pulseScale = 1 + Math.sin((frame - delay) * 0.15) * 0.1;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: borderRadius.lg,
          background: colors.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: shadows.md,
        }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill={colors.text}>
          <path d="M12 2C10.9 2 10 2.9 10 4V4.29C7.12 5.14 5 7.82 5 11V17L3 19V20H21V19L19 17V11C19 7.82 16.88 5.14 14 4.29V4C14 2.9 13.1 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 24,
          height: 24,
          borderRadius: borderRadius.full,
          background: colors.error,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.primary,
          fontSize: 12,
          fontWeight: fontWeights.bold,
          color: colors.textInverse,
          transform: `scale(${pulseScale})`,
        }}
      >
        {count}
      </div>
    </div>
  );
};
