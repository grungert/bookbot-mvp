"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

interface PricingCardProps {
  name: string;
  price: string;
  priceDetail: string;
  features: string[];
  isPopular?: boolean;
  popularLabel?: string;
  ctaText: string;
  delay?: number;
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
}: PricingCardProps) {
  const prefersReducedMotion = useReducedMotion();

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
            "border-primary/50",
            "bg-white/80 dark:bg-gray-900/80",
            "shadow-xl shadow-primary/10"
          ]
        )}
        whileHover={prefersReducedMotion ? {} : {
          scale: isPopular ? 1.05 : 1.03,
          y: -8,
          boxShadow: isPopular
            ? "0 25px 50px -12px rgba(22, 93, 252, 0.25)"
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
            <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-b-lg">
              {popularLabel}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="text-center px-6 pb-2 pt-8">
          <h3 className="text-xl font-semibold mb-4">{name}</h3>
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
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link href="/register" className="block">
            <Button
              className={cn(
                "w-full transition-all duration-200 cursor-pointer",
                !isPopular && "bg-white/50 hover:bg-white/80 text-foreground border border-white/20"
              )}
              variant={isPopular ? "default" : "outline"}
              size="lg"
            >
              {ctaText}
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
