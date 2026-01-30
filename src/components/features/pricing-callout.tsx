"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles } from "lucide-react";

interface PricingCalloutProps {
  title: string;
  subtitle: string;
  plan: string;
  price?: string;
  features?: string[];
  ctaText?: string;
  ctaHref?: string;
}

export function PricingCallout({
  title,
  subtitle,
  plan,
  price,
  features,
  ctaText = "View Pricing",
  ctaHref = "/pricing",
}: PricingCalloutProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <div className="rounded-2xl p-8 md:p-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Left side - text */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-sm font-medium mb-4 border border-blue-500/20">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>{plan}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-4">{subtitle}</p>

                {/* Features list */}
                {features && features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {features.map((feature, index) => {
                      // Interpolate between blue and purple for each feature
                      const factor = index / (features.length - 1 || 1);
                      const r = Math.round(59 + (168 - 59) * factor);
                      const g = Math.round(130 + (85 - 130) * factor);
                      const b = Math.round(246 + (247 - 246) * factor);
                      const color = `rgb(${r}, ${g}, ${b})`;

                      return (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 flex-shrink-0" style={{ color }} />
                          <span>{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Right side - price and CTA */}
              <div className="flex flex-col items-center gap-4">
                {price && (
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {price}
                    </div>
                    <div className="text-sm text-muted-foreground">/month</div>
                  </div>
                )}
                <Link href={ctaHref}>
                  <Button variant="gradient" size="lg" className="cursor-pointer">
                    {ctaText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
