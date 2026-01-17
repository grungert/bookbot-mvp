/**
 * Color utility functions for dynamic theming
 * Converts hex colors to OKLch format for CSS custom properties
 */

interface ThemePalette {
  primary: string;
  foreground: string;
  ring: string;
}

/**
 * Parse a hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Convert sRGB to linear RGB
 */
function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB to XYZ
 */
function linearRgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  return {
    x: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    y: 0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    z: 0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  };
}

/**
 * Convert XYZ to OKLab
 */
function xyzToOklab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(-0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/**
 * Convert OKLab to OKLch
 */
function oklabToOklch(l: number, a: number, b: number): { l: number; c: number; h: number } {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;

  return { l, c, h };
}

/**
 * Convert hex color to OKLch CSS format
 */
export function hexToOklch(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);
  const { x, y, z } = linearRgbToXyz(linearR, linearG, linearB);
  const { l: labL, a: labA, b: labB } = xyzToOklab(x, y, z);
  const { l, c, h } = oklabToOklch(labL, labA, labB);

  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`;
}

/**
 * Calculate relative luminance for contrast calculation
 */
function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

/**
 * Get a contrasting color (white or dark) for text on the given background
 */
export function getContrastColor(hex: string): string {
  const luminance = getRelativeLuminance(hex);
  // Use white text for dark backgrounds, dark text for light backgrounds
  // Threshold of 0.4 provides good contrast in most cases
  return luminance > 0.4 ? "oklch(0.205 0 0)" : "oklch(0.985 0 0)";
}

/**
 * Generate a complete theme palette from a primary hex color
 */
export function generateThemePalette(hex: string): ThemePalette {
  const primary = hexToOklch(hex);
  const foreground = getContrastColor(hex);

  return {
    primary,
    foreground,
    ring: primary,
  };
}
