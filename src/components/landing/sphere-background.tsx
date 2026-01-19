"use client";

import { useEffect, useRef, useState } from "react";
import type { Spheres2BackgroundInstance } from "threejs-components";

export function SphereBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<Spheres2BackgroundInstance | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;

    let mounted = true;

    const initBackground = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Spheres2Background } = await import("threejs-components");

        if (!mounted || !canvasRef.current) return;

        // Adjust sphere count based on device
        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 80 : 200;

        // Vibrant: blue → teal → rose → orange
        const colors = [0x3B82F6, 0x14B8A6, 0xF43F5E, 0xF97316];

        bgRef.current = Spheres2Background(canvasRef.current, {
          count,
          colors,
          minSize: 0.3,
          maxSize: 0.8,
          // Speed up animation
          attraction: 0.25,      // default 0.15 - stronger pull
          maxVelocity: 0.25,     // default 0.15 - faster movement
          friction: 0.995,       // default 0.999 - slightly more responsive
        });

        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to initialize sphere background:", error);
      }
    };

    initBackground();

    return () => {
      mounted = false;
      if (bgRef.current?.dispose) {
        bgRef.current.dispose();
      }
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
    );
  }

  return (
    <>
      {/* Loading gradient shown while Three.js initializes */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
      )}
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 1,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out"
        }}
      />
    </>
  );
}
