"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingOption {
  label: string;
  price: string;
  highlight?: boolean;
}

type PlanTier = "TRIAL" | "PRO" | "BUSINESS";

interface PricingCardProps {
  name: string;
  price: string;
  priceDetail: string;
  features: string[];
  isPopular?: boolean;
  popularLabel?: string;
  ctaText: string;
  delay?: number;
  index?: number;
  pricingOptions?: PricingOption[];
  planTier: PlanTier;
  onPlanSelect?: (tier: PlanTier) => void;
}

// Interpolate between blue (#3b82f6) and purple (#a855f7) based on position
function getGradientColor(index: number, totalItems: number = 3): string {
  // For a single row, factor goes from 0 (blue) to 1 (purple)
  const factor = index / (totalItems - 1);
  const clampedFactor = Math.max(0, Math.min(1, factor));

  // Blue: rgb(59, 130, 246) - Purple: rgb(168, 85, 247)
  const r = Math.round(59 + (168 - 59) * clampedFactor);
  const g = Math.round(130 + (85 - 130) * clampedFactor);
  const b = Math.round(246 + (247 - 246) * clampedFactor);

  return `rgb(${r}, ${g}, ${b})`;
}

export function PricingCard({
  name,
  price,
  priceDetail,
  features,
  isPopular = false,
  popularLabel,
  ctaText,
  delay = 0,
  index = 0,
  pricingOptions,
  planTier,
  onPlanSelect,
}: PricingCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const checkColor = getGradientColor(index);

  const handleClick = () => {
    onPlanSelect?.(planTier);
  };

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
      className={cn(isPopular && "md:-mt-4 md:mb-4")}
    >
      {/* Glass Card */}
      <motion.div
        className={cn(
          "relative h-full rounded-xl overflow-hidden",
          "bg-white/60 dark:bg-gray-900/60",
          "backdrop-blur-md",
          "border border-white/20 dark:border-white/10",
          "shadow-lg shadow-black/5",
          isPopular && [
            "border-2 border-blue-500/50",
            "bg-white/80 dark:bg-gray-900/80",
            "shadow-xl shadow-blue-500/20"
          ]
        )}
        whileHover={prefersReducedMotion ? {} : {
          scale: isPopular ? 1.05 : 1.03,
          y: -8,
          boxShadow: isPopular
            ? "0 25px 50px -12px rgba(59, 130, 246, 0.3), 0 15px 30px -8px rgba(168, 85, 247, 0.25)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        style={{
          scale: isPopular ? 1.05 : 1,
        }}
      >
        {/* Popular Badge */}
        {isPopular && popularLabel && (
          <div className="absolute -top-0 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium px-4 py-1 rounded-b-lg">
              {popularLabel}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="text-center px-6 pb-2 pt-8">
          <h3 className="text-xl font-semibold mb-4">{name}</h3>

          {/* Pricing Options Display */}
          {pricingOptions && pricingOptions.length > 0 ? (
            <div className="space-y-3">
              {pricingOptions.map((option, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.4,
                    delay: prefersReducedMotion ? 0 : delay + 0.2 + idx * 0.1,
                  }}
                  className={cn(
                    "rounded-lg p-3 transition-all",
                    option.highlight
                      ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                      : "bg-muted/30 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      option.highlight ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {option.highlight && (
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      )}
                      <span className={cn(
                        "text-xl font-bold",
                        option.highlight
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                          : "text-foreground"
                      )}>
                        {option.price}
                      </span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <motion.span
                className="text-4xl md:text-5xl font-bold"
                initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  delay: prefersReducedMotion ? 0 : delay + 0.2,
                }}
              >
                {price}
              </motion.span>
              <span className="text-muted-foreground text-sm">{priceDetail}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-6">
          {/* Features List */}
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.3,
                  delay: prefersReducedMotion ? 0 : delay + 0.3 + index * 0.05,
                }}
                className="flex items-center gap-3 text-sm"
              >
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: checkColor }} />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <Button
            onClick={handleClick}
            className={cn(
              "w-full transition-all duration-200 cursor-pointer",
              !isPopular && "bg-white/50 hover:bg-white/80 text-foreground border border-white/20"
            )}
            variant={isPopular ? "gradient" : "outline"}
            size="lg"
          >
            {ctaText}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
