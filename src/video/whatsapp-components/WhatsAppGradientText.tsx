import React from "react";
import { whatsappColors } from "../whatsappConstants";

export const WhatsAppGradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      background: `linear-gradient(135deg, ${whatsappColors.primary} 0%, ${whatsappColors.secondary} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style,
    }}
  >
    {children}
  </span>
);
