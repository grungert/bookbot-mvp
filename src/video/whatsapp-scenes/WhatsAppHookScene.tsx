import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights, colors } from "../styles/theme";
import { WhatsAppGradientText } from "../whatsapp-components/WhatsAppGradientText";
import { useWhatsAppTranslations } from "../whatsapp-translations";
import { whatsappColors } from "../whatsappConstants";

// Floating WhatsApp icon
const FloatingWhatsAppIcon: React.FC<{
  delay: number;
  position: { x: number; y: number };
  size: number;
}> = ({ delay, position, size }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 20], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sine wave floating motion
  const floatY = Math.sin((frame - delay) * 0.08) * 6;
  const floatX = Math.cos((frame - delay) * 0.06) * 4;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        opacity,
        transform: `translate(${floatX}px, ${floatY}px)`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={`${whatsappColors.primary}60`}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </div>
  );
};

export const WhatsAppHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useWhatsAppTranslations();

  // Line 1 animation
  const line1Opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line1Y = spring({
    fps,
    frame,
    config: { damping: 15, stiffness: 80 },
  });

  const line1SlideY = interpolate(line1Y, [0, 1], [40, 0]);

  // Line 2 animation (gradient text)
  const line2Opacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Y = spring({
    fps,
    frame: frame - 15,
    config: { damping: 15, stiffness: 80 },
  });

  const line2SlideY = interpolate(line2Y, [0, 1], [40, 0]);

  // Question mark animation
  const questionScale = spring({
    fps,
    frame: frame - 20,
    config: { damping: 10, stiffness: 100 },
  });

  // Fade out for transition
  const fadeOut = interpolate(frame, [70, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating WhatsApp icons positions
  const icons = [
    { delay: 5, position: { x: 200, y: 250 }, size: 40 },
    { delay: 15, position: { x: 1650, y: 300 }, size: 48 },
    { delay: 25, position: { x: 300, y: 650 }, size: 36 },
    { delay: 10, position: { x: 1500, y: 600 }, size: 42 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating WhatsApp icons */}
      {icons.map((icon, index) => (
        <FloatingWhatsAppIcon key={index} {...icon} />
      ))}

      {/* Main text */}
      <div
        style={{
          opacity: fadeOut,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1SlideY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 76,
              fontWeight: fontWeights.bold,
              color: colors.text,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {t.hook.line1}
          </span>
        </div>

        {/* Line 2 with gradient */}
        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2SlideY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <WhatsAppGradientText
            style={{
              fontFamily: fonts.heading,
              fontSize: 76,
              fontWeight: fontWeights.bold,
            }}
          >
            {t.hook.line2}
          </WhatsAppGradientText>
        </div>
      </div>
    </AbsoluteFill>
  );
};
