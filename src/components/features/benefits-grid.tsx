"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import type { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsGridProps {
  title: string;
  subtitle?: string;
  benefits: Benefit[];
}

// Interpolate between blue (#3b82f6) and purple (#a855f7) based on position
function getGradientColor(index: number, totalItems: number = 4): { bg: string; icon: string } {
  const factor = index / (totalItems - 1 || 1);
  const clampedFactor = Math.max(0, Math.min(1, factor));

  // Blue: rgb(59, 130, 246) - Purple: rgb(168, 85, 247)
  const r = Math.round(59 + (168 - 59) * clampedFactor);
  const g = Math.round(130 + (85 - 130) * clampedFactor);
  const b = Math.round(246 + (247 - 246) * clampedFactor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
    icon: `rgb(${r}, ${g}, ${b})`,
  };
}

export function BenefitsGrid({ title, subtitle, benefits }: BenefitsGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-xl text-foreground/80 max-w-2xl mx-auto"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px",
              }}
            >
              {subtitle}
            </p>
          )}
        </ScrollReveal>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const colors = getGradientColor(index, benefits.length);

            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.4,
                  delay: prefersReducedMotion ? 0 : 0.1 + index * 0.1,
                }}
                className="group"
              >
                <div
                  className={cn(
                    "relative rounded-2xl p-6 h-full",
                    "bg-white/60 dark:bg-gray-900/60",
                    "backdrop-blur-md",
                    "border border-white/20 dark:border-white/10",
                    "hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-gray-900/80",
                    "transition-all duration-300"
                  )}
                  style={{
                    boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(59, 130, 246, 0.2), 0 20px 40px -15px rgba(168, 85, 247, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)";
                  }}
                >
                  {/* Icon */}
                  <div
                    className="inline-flex p-3 rounded-xl mb-4 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <Icon className="h-6 w-6" style={{ color: colors.icon }} />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
