"use client";

import { cn } from "@/lib/utils";
import { formatTokenCount } from "@/lib/utils/format-tokens";

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  unlimited?: boolean;
  showPercentage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string; // Custom color (hex) for the progress bar
  formatAsTokens?: boolean;
}

export function UsageMeter({
  label,
  used,
  limit,
  unlimited = false,
  showPercentage = true,
  className,
  size = "md",
  color,
  formatAsTokens = false,
}: UsageMeterProps) {
  const percentage = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percentage >= 80 && percentage < 100;
  const isExceeded = percentage >= 100;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  // Custom color always takes precedence when provided
  const barColor = color;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span
          className={cn(
            "text-muted-foreground",
            !barColor && isWarning && "text-amber-600",
            !barColor && isExceeded && "text-destructive font-medium"
          )}
          style={barColor && isExceeded ? { color: barColor, fontWeight: 500 } : undefined}
        >
          {unlimited ? (
            <span className="text-muted-foreground">{formatAsTokens ? formatTokenCount(used) : used} used</span>
          ) : (
            <>
              {formatAsTokens ? formatTokenCount(used) : used.toLocaleString()} / {formatAsTokens ? formatTokenCount(limit) : limit.toLocaleString()}
              {showPercentage && (
                <span className="ml-1 text-xs">({percentage}%)</span>
              )}
            </>
          )}
        </span>
      </div>
      {!unlimited && (
        <div
          className={cn(
            "w-full bg-muted rounded-full overflow-hidden",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              !barColor && isExceeded
                ? "bg-destructive"
                : !barColor && isWarning
                ? "bg-amber-500"
                : !barColor && "bg-primary"
            )}
            style={{
              width: `${Math.min(100, percentage)}%`,
              ...(barColor && { backgroundColor: barColor }),
            }}
          />
        </div>
      )}
      {unlimited && (
        <div
          className={cn("w-full rounded-full", sizeClasses[size])}
          style={{ backgroundColor: color ? `${color}20` : undefined }}
        >
          <div
            className={cn("h-full w-full rounded-full", !color && "bg-gradient-to-r from-primary/40 to-primary/60")}
            style={color ? { background: `linear-gradient(to right, ${color}40, ${color}60)` } : undefined}
          />
        </div>
      )}
    </div>
  );
}
