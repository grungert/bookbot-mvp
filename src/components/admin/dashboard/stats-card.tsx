"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  animationIndex?: number;
  prefersReducedMotion?: boolean;
  /** Gradient color class for background, e.g., "from-primary/5" */
  gradientFrom?: string;
}

// Map icon backgrounds to gradient classes
const iconBgToGradient: Record<string, string> = {
  "bg-primary/10": "from-primary/5",
  "bg-amber-500/10": "from-amber-500/5",
  "bg-green-500/10": "from-green-500/5",
  "bg-emerald-500/10": "from-emerald-500/5",
  "bg-purple-500/10": "from-purple-500/5",
  "bg-violet-500/10": "from-violet-500/5",
  "bg-cyan-500/10": "from-cyan-500/5",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
  animationIndex = 0,
  prefersReducedMotion = false,
  gradientFrom,
}: StatsCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = trend !== undefined && trend > 0;

  // Extract numeric value if value is a string with currency
  const isNumericValue = typeof value === "number";
  const numericValue = isNumericValue ? value : null;

  // Determine gradient class from iconBg
  const gradientClass = gradientFrom || iconBgToGradient[iconBg] || "from-primary/5";

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-gradient-to-br to-transparent p-4 transition-all duration-300",
        "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
        gradientClass,
        !prefersReducedMotion && "animate-fade-in-scale"
      )}
      style={
        !prefersReducedMotion
          ? { opacity: 0, animationDelay: `${animationIndex * 50}ms` }
          : undefined
      }
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <div
          className={cn(
            "rounded-lg p-2 transition-all duration-300",
            "group-hover:scale-110 group-hover:shadow-md",
            iconBg
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              iconColor,
              !prefersReducedMotion && "group-hover:animate-icon-pulse"
            )}
          />
        </div>
      </div>
      <div className="text-2xl font-bold">
        {numericValue !== null ? (
          <AnimatedNumber
            value={numericValue}
            prefersReducedMotion={prefersReducedMotion}
            duration={800}
          />
        ) : (
          value
        )}
      </div>
      {hasTrend && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <TrendingUp
              className={cn(
                "h-3 w-3 text-green-500",
                !prefersReducedMotion && "animate-trend-bounce"
              )}
            />
          ) : (
            <TrendingDown
              className={cn(
                "h-3 w-3 text-red-500",
                !prefersReducedMotion && "animate-trend-bounce"
              )}
            />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {isPositive ? "+" : ""}
            {trend}%
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
