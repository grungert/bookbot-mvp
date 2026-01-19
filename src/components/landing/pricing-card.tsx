"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      <Card
        className={cn(
          "relative h-full transition-all duration-300 hover:shadow-lg",
          isPopular && "border-primary shadow-lg scale-105 md:scale-110"
        )}
      >
        {/* Popular Badge */}
        {isPopular && popularLabel && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
              {popularLabel}
            </span>
          </div>
        )}

        <CardHeader className="text-center pb-2 pt-8">
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
        </CardHeader>

        <CardContent className="pt-6">
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
              className="w-full"
              variant={isPopular ? "default" : "outline"}
              size="lg"
            >
              {ctaText}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
