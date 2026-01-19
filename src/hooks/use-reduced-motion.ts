"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect user's motion preference.
 * Returns true if user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation class names only if user doesn't prefer reduced motion.
 * Useful for conditionally applying animations.
 */
export function useAnimationClass(
  animationClass: string,
  fallbackClass = ""
): string {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? fallbackClass : animationClass;
}
