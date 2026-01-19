"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  calculateDiscountedPrice,
  formatPrice,
  type ServiceWithDiscount,
} from "@/lib/utils/discount";

interface ServicePriceDisplayProps {
  service: ServiceWithDiscount;
  size?: "sm" | "md" | "lg";
  showCountdown?: boolean;
  className?: string;
}

export function ServicePriceDisplay({
  service,
  size = "md",
  showCountdown = true,
  className,
}: ServicePriceDisplayProps) {
  const result = calculateDiscountedPrice(service);

  const sizeClasses = {
    sm: {
      original: "text-xs",
      final: "text-sm font-medium",
      badge: "text-[10px] px-1.5 py-0.5",
      countdown: "text-[10px]",
    },
    md: {
      original: "text-sm",
      final: "text-base font-semibold",
      badge: "text-xs px-2 py-0.5",
      countdown: "text-xs",
    },
    lg: {
      original: "text-base",
      final: "text-lg font-bold",
      badge: "text-sm px-2.5 py-1",
      countdown: "text-sm",
    },
  };

  const classes = sizeClasses[size];

  if (!result.isDiscounted) {
    return (
      <Badge variant="secondary" className={cn(classes.final, className)}>
        {formatPrice(result.originalPrice, service.currency)}
      </Badge>
    );
  }

  return (
    <div className={cn("flex flex-col items-start gap-0.5", className)}>
      <div className="flex items-center gap-2">
        {/* Original price with strikethrough */}
        <span
          className={cn(
            classes.original,
            "text-muted-foreground line-through discount-strikethrough"
          )}
        >
          {formatPrice(result.originalPrice, service.currency)}
        </span>

        {/* Discount percentage badge */}
        <span
          className={cn(
            classes.badge,
            "bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md font-medium"
          )}
        >
          -{result.discountPercentage}%
        </span>
      </div>

      {/* Final discounted price */}
      <span className={cn(classes.final, "text-emerald-600 dark:text-emerald-400")}>
        {formatPrice(Math.round(result.finalPrice), service.currency)}
      </span>

      {/* Countdown timer */}
      {showCountdown && result.timeRemaining && (
        <span
          className={cn(
            classes.countdown,
            "text-muted-foreground",
            result.isExpiringSoon && "text-orange-500 animate-countdown-tick font-medium"
          )}
        >
          {result.timeRemaining.displayText}
        </span>
      )}
    </div>
  );
}
