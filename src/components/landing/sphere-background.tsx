"use client";

import { useEffect, useRef, useState } from "react";
import type { Spheres2BackgroundInstance } from "threejs-components";

export function SphereBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<Spheres2BackgroundInstance | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
        const { Spheres2Background } = await import("threejs-components");

        if (!mounted || !canvasRef.current) return;

        const isMobile = window.innerWidth < 768;
        const count = isMobile ? 80 : 200;

        // All blues: deep blue → medium blue → light blue → very light blue
        const colors = [0x165DFC, 0x3B82F6, 0x93C5FD, 0xBFDBFE];

        bgRef.current = Spheres2Background(canvasRef.current, {
          count,
          colors,
          minSize: 0.3,
          maxSize: 0.8,
          attraction: 0.25,
          maxVelocity: 0.25,
          friction: 0.995,
        });

        // Change light color to blue to remove pink tint
        if (bgRef.current?.spheres?.light1?.color) {
          bgRef.current.spheres.light1.color.set(0x3B82F6);
        }

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
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
      )}
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out"
        }}
      />
    </>
  );
}
