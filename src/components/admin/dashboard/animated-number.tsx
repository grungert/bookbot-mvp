"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  prefersReducedMotion?: boolean;
}

/**
 * Animates a number from 0 to the target value.
 * Uses requestAnimationFrame for smooth 60fps animation.
 * Respects prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  duration = 1000,
  formatFn = (v) => v.toLocaleString(),
  prefersReducedMotion = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : 0);
  const previousValueRef = useRef(prefersReducedMotion ? value : 0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    const easeOutQuart = (t: number): number => {
      return 1 - Math.pow(1 - t, 4);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, prefersReducedMotion]);

  return <span aria-live="polite">{formatFn(displayValue)}</span>;
}
