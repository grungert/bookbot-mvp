// Discount utility functions for service pricing

export type DiscountType = "percentage" | "fixed" | null;
export type PromotionalBadge = "SALE" | "NEW" | "POPULAR" | "HOT" | null;

export interface ServiceWithDiscount {
  price: number;
  currency: string;
  discountType?: DiscountType;
  discountValue?: number | null;
  discountStartDate?: Date | string | null;
  discountEndDate?: Date | string | null;
  promotionalBadge?: PromotionalBadge;
  customBadgeLabel?: string | null;
}

export interface DiscountedPriceResult {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  isDiscounted: boolean;
  timeRemaining: TimeRemaining | null;
  isExpiringSoon: boolean; // Within 3 days
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
  displayText: string;
}

// Translation function type for i18n support
export type TimeRemainingTranslator = (key: string, values?: Record<string, number>) => string;

export interface BadgeInfo {
  label: string;
  gradient: string;
  textColor: string;
}

/**
 * Check if a discount is currently active
 */
export function isDiscountActive(service: ServiceWithDiscount): boolean {
  if (!service.discountType || !service.discountValue) {
    return false;
  }

  const now = new Date();

  if (service.discountStartDate) {
    const start = new Date(service.discountStartDate);
    if (now < start) return false;
  }

  if (service.discountEndDate) {
    const end = new Date(service.discountEndDate);
    if (now > end) return false;
  }

  return true;
}

// Default English translations for time remaining
const defaultTimeRemainingTranslations: Record<string, string> = {
  "endsInDays": "Ends in {count} days",
  "endsInDay": "Ends in 1 day",
  "endsInHours": "Ends in {count} hours",
  "endsInHour": "Ends in 1 hour",
  "endsInMinutes": "Ends in {count} min",
  "endsSoon": "Ends soon!",
};

/**
 * Calculate the time remaining until discount ends
 * @param endDate - The end date of the discount
 * @param t - Optional translation function for i18n support. If not provided, uses English defaults.
 *            Expected keys: endsInDays, endsInDay, endsInHours, endsInHour, endsInMinutes, endsSoon
 */
export function getTimeRemaining(
  endDate: Date | string | null | undefined,
  t?: TimeRemainingTranslator
): TimeRemaining | null {
  if (!endDate) return null;

  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  // Use translator if provided, otherwise use default English
  const translate = (key: string, values?: Record<string, number>): string => {
    if (t) {
      return t(key, values);
    }
    // Default English fallback
    let text = defaultTimeRemainingTranslations[key] || key;
    if (values?.count !== undefined) {
      text = text.replace("{count}", values.count.toString());
    }
    return text;
  };

  let displayText: string;
  if (days > 0) {
    displayText = days === 1
      ? translate("endsInDay")
      : translate("endsInDays", { count: days });
  } else if (hours > 0) {
    displayText = hours === 1
      ? translate("endsInHour")
      : translate("endsInHours", { count: hours });
  } else {
    displayText = minutes <= 1
      ? translate("endsSoon")
      : translate("endsInMinutes", { count: minutes });
  }

  return {
    days,
    hours,
    minutes,
    totalMs: diff,
    displayText,
  };
}

/**
 * Calculate the discounted price and related info
 * @param service - Service with discount fields
 * @param t - Optional translation function for i18n support (passed to getTimeRemaining)
 */
export function calculateDiscountedPrice(
  service: ServiceWithDiscount,
  t?: TimeRemainingTranslator
): DiscountedPriceResult {
  const originalPrice = Number(service.price);

  if (!isDiscountActive(service)) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      discountPercentage: 0,
      isDiscounted: false,
      timeRemaining: null,
      isExpiringSoon: false,
    };
  }

  const discountValue = Number(service.discountValue);
  let discountAmount: number;
  let discountPercentage: number;

  if (service.discountType === "percentage") {
    discountPercentage = Math.min(discountValue, 100);
    discountAmount = originalPrice * (discountPercentage / 100);
  } else {
    // Fixed amount
    discountAmount = Math.min(discountValue, originalPrice);
    discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);
  const timeRemaining = getTimeRemaining(service.discountEndDate, t);

  // Expiring soon if within 3 days
  const isExpiringSoon = timeRemaining !== null && timeRemaining.days <= 3;

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    discountPercentage: Math.round(discountPercentage),
    isDiscounted: true,
    timeRemaining,
    isExpiringSoon,
  };
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string): string {
  return `${currency} ${price.toLocaleString()}`;
}

/**
 * Get badge info (label and gradient colors) for promotional badges
 */
export function getBadgeInfo(
  badge: PromotionalBadge | null | undefined,
  customLabel?: string | null
): BadgeInfo | null {
  if (customLabel) {
    return {
      label: customLabel,
      gradient: "from-indigo-500 to-purple-600",
      textColor: "text-white",
    };
  }

  if (!badge) return null;

  const badgeConfigs: Record<string, BadgeInfo> = {
    SALE: {
      label: "SALE",
      gradient: "from-red-500 to-orange-500",
      textColor: "text-white",
    },
    NEW: {
      label: "NEW",
      gradient: "from-emerald-500 to-teal-500",
      textColor: "text-white",
    },
    POPULAR: {
      label: "POPULAR",
      gradient: "from-amber-500 to-yellow-500",
      textColor: "text-white",
    },
    HOT: {
      label: "HOT",
      gradient: "from-rose-500 to-pink-500",
      textColor: "text-white",
    },
  };

  return badgeConfigs[badge] || null;
}

/**
 * Get the savings display text (e.g., "You save RSD 500!")
 */
export function getSavingsText(result: DiscountedPriceResult, currency: string): string | null {
  if (!result.isDiscounted || result.discountAmount === 0) return null;
  return `You save ${formatPrice(Math.round(result.discountAmount), currency)}!`;
}
