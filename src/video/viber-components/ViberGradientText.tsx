import React from "react";
import { viberColors } from "../viberConstants";

export const ViberGradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      background: `linear-gradient(135deg, ${viberColors.primary} 0%, ${viberColors.secondary} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style,
    }}
  >
    {children}
  </span>
);
