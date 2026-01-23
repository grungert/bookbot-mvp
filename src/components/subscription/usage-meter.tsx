"use client";

import { cn } from "@/lib/utils";

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  unlimited?: boolean;
  showPercentage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UsageMeter({
  label,
  used,
  limit,
  unlimited = false,
  showPercentage = true,
  className,
  size = "md",
}: UsageMeterProps) {
  const percentage = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percentage >= 80 && percentage < 100;
  const isExceeded = percentage >= 100;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span
          className={cn(
            "text-muted-foreground",
            isWarning && "text-amber-600",
            isExceeded && "text-destructive font-medium"
          )}
        >
          {unlimited ? (
            <span className="text-muted-foreground">{used} used</span>
          ) : (
            <>
              {used.toLocaleString()} / {limit.toLocaleString()}
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
              isExceeded
                ? "bg-destructive"
                : isWarning
                ? "bg-amber-500"
                : "bg-primary"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
      {unlimited && (
        <div className={cn("w-full bg-primary/20 rounded-full", sizeClasses[size])}>
          <div className="h-full w-full bg-gradient-to-r from-primary/40 to-primary/60 rounded-full" />
        </div>
      )}
    </div>
  );
}
