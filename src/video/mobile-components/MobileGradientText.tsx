import React from "react";
import { mobileColors } from "../mobileConstants";

export const MobileGradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      background: `linear-gradient(135deg, ${mobileColors.primary} 0%, ${mobileColors.secondary} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style,
    }}
  >
    {children}
  </span>
);
