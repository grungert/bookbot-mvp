import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights } from "../styles/theme";
import { MobilePhone } from "../mobile-components/MobilePhone";
import { MobileNotification } from "../mobile-components/MobileNotification";
import { MobileAppointmentCard } from "../mobile-components/MobileAppointmentCard";
import { useMobileTranslations } from "../mobile-translations";
import { mobileColors } from "../mobileConstants";

// Feature highlight component
const FeatureHighlight: React.FC<{
  icon: React.ReactNode;
  text: string;
  delay: number;
}> = ({ icon, text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideX = interpolate(progress, [0, 1], [-30, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity,
        transform: `translateX(${slideX}px)`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: fonts.primary,
          fontSize: 18,
          fontWeight: fontWeights.medium,
          color: "white",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const MobileDemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useMobileTranslations();

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

  // Demo timing:
  // 0-30: Phone appears with dashboard
  // 30-90: Notification slides in
  // 90-150: Notification hides
  // 120-180: Appointment card appears
  // 300: User taps confirm
  // 300+: Success animation

  const notificationStartFrame = 30;
  const notificationHideFrame = 150;
  const appointmentStartFrame = 120;
  const confirmFrame = 300;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          width: "100%",
          maxWidth: 1400,
        }}
      >
        {/* Left side - Title panel */}
        <div
          style={{
            flex: "0 0 480px",
            opacity: titleOpacity,
            transform: `translateY(${titleSlideY}px)`,
            background: `linear-gradient(135deg, ${mobileColors.primary}80 0%, ${mobileColors.secondary}80 100%)`,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 28,
            padding: "48px 52px",
            boxShadow: `
              0 25px 50px -12px ${mobileColors.primary}40,
              0 15px 30px -8px ${mobileColors.secondary}30,
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.05)
            `,
            border: "1px solid rgba(255, 255, 255, 0.35)",
          }}
        >
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 56,
              fontWeight: fontWeights.bold,
              color: "white",
              margin: 0,
              marginBottom: 24,
              lineHeight: 1.2,
            }}
          >
            {t.demo.title}{" "}
            <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              {t.demo.titleHighlight}
            </span>
          </h2>

          {/* Feature highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              }
              text={t.demo.features.notifications}
              delay={50}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              }
              text={t.demo.features.oneTap}
              delay={70}
            />
            <FeatureHighlight
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                </svg>
              }
              text={t.demo.features.calendar}
              delay={90}
            />
          </div>
        </div>

        {/* Right side - Mobile phone mockup with dashboard */}
        <div style={{ position: "relative" }}>
          <MobilePhone
            headerText={t.demo.dashboard.header}
            statsToday={t.demo.dashboard.statsToday}
            statsWeek={t.demo.dashboard.statsWeek}
            todayCount={t.demo.dashboard.todayCount}
            weekCount={t.demo.dashboard.weekCount}
            startFrame={10}
          >
            {/* Appointment card */}
            <MobileAppointmentCard
              name={t.demo.dashboard.appointment.name}
              service={t.demo.dashboard.appointment.service}
              time={t.demo.dashboard.appointment.time}
              confirmText={t.demo.dashboard.confirmButton}
              confirmedText={t.demo.dashboard.confirmed}
              startFrame={appointmentStartFrame}
              confirmFrame={confirmFrame}
            />
          </MobilePhone>

          {/* Notification overlay */}
          <MobileNotification
            title={t.demo.dashboard.notification.title}
            subtitle={t.demo.dashboard.notification.subtitle}
            startFrame={notificationStartFrame}
            hideFrame={notificationHideFrame}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
