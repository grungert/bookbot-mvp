"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
  showText?: boolean;
}

// Ball size relative to bowl width, and bowl height is half of bowl width
const sizes = {
  sm: { ballSize: 10, bowlWidth: 20, text: "text-lg" },
  md: { ballSize: 14, bowlWidth: 28, text: "text-xl" },
  lg: { ballSize: 18, bowlWidth: 36, text: "text-2xl" },
  xl: { ballSize: 24, bowlWidth: 48, text: "text-3xl" },
  xxl: { ballSize: 36, bowlWidth: 72, text: "text-4xl" },
};

export function Logo({ size = "md", className, showText = false }: LogoProps) {
  const s = sizes[size];
  const bowlHeight = s.bowlWidth / 2;
  // Ball overlaps bowl by ~20% of ball size
  const overlap = s.ballSize * 0.2;
  const containerHeight = s.ballSize + bowlHeight - overlap;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="relative"
        style={{
          width: s.bowlWidth,
          height: containerHeight
        }}
      >
        {/* Ball - positioned at top center, behind the bowl */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: s.ballSize,
            height: s.ballSize,
            top: 0,
            background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
            boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.3)",
          }}
        />

        {/* Bowl/Half-circle - positioned at bottom, in front of ball */}
        <div
          className="absolute bottom-0 left-0 rounded-b-full"
          style={{
            width: s.bowlWidth,
            height: bowlHeight,
            background: `
              radial-gradient(ellipse 100% 80% at 50% 0%, rgba(147, 197, 253, 0.95) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 50% 100%, rgba(96, 165, 250, 0.6) 0%, transparent 50%),
              linear-gradient(180deg, rgba(147, 197, 253, 0.85) 0%, rgba(59, 130, 246, 0.75) 40%, rgba(37, 99, 235, 0.8) 70%, rgba(96, 165, 250, 0.7) 100%)
            `,
            boxShadow: `
              inset 0 -6px 12px rgba(255,255,255,0.25),
              inset 0 4px 8px rgba(59, 130, 246, 0.2),
              inset 0 1px 2px rgba(255,255,255,0.5),
              0 4px 15px rgba(59, 130, 246, 0.25)
            `,
          }}
        />
      </div>

      {showText && (
        <span className={cn("font-bold", s.text)}>BookBot</span>
      )}
    </div>
  );
}
