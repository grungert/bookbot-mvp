// BookBot Theme - Colors, fonts, and styling constants

export const colors = {
  // Primary colors (BookBot blue)
  primary: "#1f56da", // Deep blue
  primaryLight: "#86b6ff", // Light blue
  primaryDark: "#0f3a9e",

  // Landing page gradient colors
  blue: "#3b82f6", // Tailwind blue-500
  purple: "#a855f7", // Tailwind purple-500
  blueLight: "#60a5fa", // Tailwind blue-400
  purpleLight: "#c084fc", // Tailwind purple-400

  // Accent colors
  accent: "#86b6ff", // Light blue
  accentLight: "#b8d4ff",
  accentDark: "#1f56da",

  // Semantic colors
  success: "#22C55E", // Green
  successLight: "#4ADE80",
  warning: "#F59E0B", // Amber
  warningLight: "#FBBF24",
  error: "#EF4444", // Red

  // Neutral colors
  background: "#F8FAFC", // Light gray
  backgroundDark: "#0F172A", // Dark slate
  surface: "#FFFFFF",
  surfaceDark: "#1E293B",

  // Text colors
  text: "#1E293B", // Dark slate
  textLight: "#64748B", // Slate
  textInverse: "#FFFFFF",

  // Gradient definitions
  gradients: {
    primary: "linear-gradient(135deg, #1f56da 0%, #86b6ff 100%)",
    hero: "linear-gradient(135deg, #1f56da 0%, #3b7ddd 50%, #1f56da 100%)",
    card: "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)",
    sphere: "radial-gradient(circle at 30% 30%, #86b6ff 0%, #1f56da 50%, #0f3a9e 100%)",
    sphereBlue: "radial-gradient(circle at 30% 30%, #b8d4ff 0%, #86b6ff 50%, #1f56da 100%)",
    // Landing page gradients
    blueToPurple: "linear-gradient(to right, #3b82f6, #a855f7)",
    ctaButton: "linear-gradient(to right, #3b82f6, #a855f7)",
    // Mobile gradient for channels
    mobile: "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)",
  },

  // Channel colors
  channelColors: {
    whatsapp: "#25D366",
    viber: "#7360F2",
    website: "#3b82f6",
  },
};

// Calculate gradient color based on grid position (for icon colors)
export function getIconGradientColor(index: number, totalColumns: number = 3): { bg: string; icon: string } {
  const row = Math.floor(index / totalColumns);
  const col = index % totalColumns;
  const factor = Math.min(1, Math.max(0, (col + row * 0.3) / 2.5));

  // Blue: rgb(59, 130, 246) → Purple: rgb(168, 85, 247)
  const r = Math.round(59 + (168 - 59) * factor);
  const g = Math.round(130 + (85 - 130) * factor);
  const b = Math.round(246 + (247 - 246) * factor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
    icon: `rgb(${r}, ${g}, ${b})`,
  };
}

// Get gradient color for single-row layouts
export function getLinearGradientColor(index: number, total: number): { bg: string; icon: string } {
  const factor = total > 1 ? index / (total - 1) : 0;

  const r = Math.round(59 + (168 - 59) * factor);
  const g = Math.round(130 + (85 - 130) * factor);
  const b = Math.round(246 + (247 - 246) * factor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
    icon: `rgb(${r}, ${g}, ${b})`,
  };
}

export const fonts = {
  primary: "Inter, system-ui, sans-serif",
  heading: "Inter, system-ui, sans-serif",
  mono: "JetBrains Mono, monospace",
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  glow: "0 0 40px rgba(139, 92, 246, 0.3)",
  glowBlue: "0 0 40px rgba(59, 130, 246, 0.3)",
  // Glass card shadows with blue/purple accents
  glassCard: "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)",
  glassCardHover: "0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 20px 40px -15px rgba(168, 85, 247, 0.2)",
  // CTA button glow
  ctaGlow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 20px rgba(168, 85, 247, 0.5)",
};

// Scene timing configuration (in frames at 30fps)
export const sceneTiming = {
  hook: { start: 0, duration: 120 }, // 0-4s (120 frames)
  hero: { start: 120, duration: 150 }, // 4-9s (150 frames)
  channels: { start: 270, duration: 240 }, // 9-17s (240 frames) - NEW
  chatDemo: { start: 510, duration: 300 }, // 17-27s (300 frames)
  dashboard: { start: 810, duration: 300 }, // 27-37s (300 frames)
  features: { start: 1110, duration: 300 }, // 37-47s (300 frames)
  useCases: { start: 1410, duration: 150 }, // 47-52s (150 frames)
  cta: { start: 1560, duration: 240 }, // 52-60s (240 frames)
};

// Animation presets
export const animations = {
  springConfig: {
    damping: 15,
    mass: 1,
    stiffness: 100,
  },
  springFast: {
    damping: 20,
    mass: 0.8,
    stiffness: 150,
  },
  springSlow: {
    damping: 25,
    mass: 1.2,
    stiffness: 80,
  },
};
