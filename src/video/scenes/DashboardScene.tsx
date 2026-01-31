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
  StatsCard,
  RevenueChart,
  DonutChart,
  NotificationBadge,
} from "../components/StatsCard";
import { GradientText, GlassPanel } from "../components/AnimatedBackground";
import { useTranslations } from "../translations";

// Icon components for stats cards
const DollarIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.52 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z" />
  </svg>
);

const UsersIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM9 14H7V12H9V14ZM13 14H11V12H13V14ZM17 14H15V12H17V14Z" />
  </svg>
);

const TrendIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" />
  </svg>
);

export const DashboardScene: React.FC = () => {
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

  // Dashboard mockup animation
  const dashboardScale = spring({
    fps,
    frame: frame - 20,
    config: { damping: 18, stiffness: 70 },
  });

  const dashboardOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 50,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${interpolate(titleY, [0, 1], [40, 0])}px)`,
          marginBottom: 30,
        }}
      >
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: 56,
            fontWeight: fontWeights.bold,
            color: colors.text,
            margin: 0,
            textAlign: "center",
                      }}
        >
          {t.dashboard.title}{" "}
          <GradientText>{t.dashboard.titleHighlight}</GradientText>
        </h2>
      </div>

      {/* Dashboard mockup with glass effect */}
      <GlassPanel
        style={{
          opacity: dashboardOpacity,
          transform: `scale(${dashboardScale})`,
          padding: 36,
          width: "100%",
          maxWidth: 1600,
        }}
      >
          {/* Dashboard header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontFamily: fonts.heading,
                fontSize: 28,
                fontWeight: fontWeights.bold,
                color: colors.text,
              }}
            >
              {t.dashboard.overview}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <NotificationBadge count={5} delay={80} />
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
              marginBottom: 32,
            }}
          >
            <StatsCard
              title={t.dashboard.stats.revenue}
              value="$12,450"
              change="+12.5%"
              changeType="positive"
              icon={<DollarIcon />}
              delay={40}
              index={0}
              total={4}
              useGradientColor={true}
            />
            <StatsCard
              title={t.dashboard.stats.bookings}
              value={156}
              change="+8.2%"
              changeType="positive"
              icon={<CalendarIcon />}
              delay={50}
              index={1}
              total={4}
              useGradientColor={true}
            />
            <StatsCard
              title={t.dashboard.stats.customers}
              value={89}
              change="+15.3%"
              changeType="positive"
              icon={<UsersIcon />}
              delay={60}
              index={2}
              total={4}
              useGradientColor={true}
            />
            <StatsCard
              title={t.dashboard.stats.growth}
              value="23%"
              change="+4.1%"
              changeType="positive"
              icon={<TrendIcon />}
              delay={70}
              index={3}
              total={4}
              useGradientColor={true}
            />
          </div>

        {/* Charts row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 24,
            minHeight: 260,
          }}
        >
          <RevenueChart delay={90} />
          <DonutChart delay={110} />
        </div>
      </GlassPanel>
    </AbsoluteFill>
  );
};
