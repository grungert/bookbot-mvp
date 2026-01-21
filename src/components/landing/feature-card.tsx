"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  delay?: number;
  index?: number; // Position in grid for unified gradient effect
}

// Interpolate between blue (#3b82f6) and purple (#a855f7) based on position
function getGradientColor(index: number, totalCards: number = 6): { bg: string; icon: string } {
  // For a 3-column grid at 30 degrees, calculate position factor
  // Row and column affect the gradient position
  const row = Math.floor(index / 3);
  const col = index % 3;

  // 30-degree angle: combine horizontal and slight vertical offset
  // Factor goes from 0 (blue) to 1 (purple)
  const factor = (col + row * 0.3) / 2.5;

  // Clamp factor between 0 and 1
  const clampedFactor = Math.max(0, Math.min(1, factor));

  // Blue: rgb(59, 130, 246) - Purple: rgb(168, 85, 247)
  const r = Math.round(59 + (168 - 59) * clampedFactor);
  const g = Math.round(130 + (85 - 130) * clampedFactor);
  const b = Math.round(246 + (247 - 246) * clampedFactor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.3)`,
    icon: `rgb(${r}, ${g}, ${b})`
  };
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  delay = 0,
  index = 0,
}: FeatureCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const colors = getGradientColor(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut",
      }}
    >
      {/* Glass Card */}
      <div
        className={cn(
          "group h-full rounded-xl p-6",
          "bg-white/60 dark:bg-gray-900/60",
          "backdrop-blur-md",
          "border border-white/20 dark:border-white/10",
          "shadow-lg",
          "hover:-translate-y-2 hover:bg-white/85 dark:hover:bg-gray-900/85",
          "transition-all duration-300"
        )}
        style={{
          boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 20px 40px -15px rgba(168, 85, 247, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)";
        }}
      >
        <div className="space-y-4">
          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "backdrop-blur-sm transition-all",
              "group-hover:scale-105"
            )}
            style={{ backgroundColor: colors.bg }}
          >
            <Icon className="h-7 w-7" style={{ color: colors.icon }} />
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {/* Feature List */}
          <div className="space-y-2 pt-2">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.3,
                  delay: prefersReducedMotion ? 0 : delay + 0.1 + index * 0.1,
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: colors.icon }} />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
