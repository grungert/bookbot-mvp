"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getBadgeInfo, type PromotionalBadge as PromotionalBadgeType } from "@/lib/utils/discount";

interface PromotionalBadgeProps {
  badge?: PromotionalBadgeType;
  customLabel?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export function PromotionalBadge({
  badge,
  customLabel,
  size = "md",
  className,
  animate = true,
}: PromotionalBadgeProps) {
  const t = useTranslations("services");
  const badgeInfo = getBadgeInfo(badge, customLabel);

  if (!badgeInfo) return null;

  // Get translated label for preset badges
  const getTranslatedLabel = () => {
    if (customLabel) return customLabel;
    if (!badge) return badgeInfo.label;

    const translationKeys: Record<string, string> = {
      SALE: "badgeSale",
      NEW: "badgeNew",
      POPULAR: "badgePopular",
      HOT: "badgeHot",
    };

    return t(translationKeys[badge] || badge);
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-semibold tracking-wide uppercase",
        "bg-gradient-to-r shadow-sm",
        badgeInfo.gradient,
        badgeInfo.textColor,
        sizeClasses[size],
        animate && "animate-pulse-subtle",
        className
      )}
    >
      {getTranslatedLabel()}
    </span>
  );
}
