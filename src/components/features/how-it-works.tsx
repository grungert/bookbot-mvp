"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface HowItWorksProps {
  title: string;
  subtitle?: string;
  steps: Step[];
}

// Interpolate between blue (#3b82f6) and purple (#a855f7) based on position
function getGradientColor(index: number, totalItems: number = 4): { bg: string; bgSolid: string; icon: string; border: string; lineFade: string } {
  const factor = index / (totalItems - 1 || 1);
  const clampedFactor = Math.max(0, Math.min(1, factor));

  // Blue: rgb(59, 130, 246) - Purple: rgb(168, 85, 247)
  const r = Math.round(59 + (168 - 59) * clampedFactor);
  const g = Math.round(130 + (85 - 130) * clampedFactor);
  const b = Math.round(246 + (247 - 246) * clampedFactor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`,
    bgSolid: `rgb(${r}, ${g}, ${b})`,
    icon: `rgb(${r}, ${g}, ${b})`,
    border: `rgba(${r}, ${g}, ${b}, 0.3)`,
    lineFade: `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.4), transparent)`,
  };
}

export function HowItWorks({ title, subtitle, steps }: HowItWorksProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-24 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
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

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const colors = getGradientColor(index, steps.length);
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  delay: prefersReducedMotion ? 0 : index * 0.15,
                }}
                className="relative flex gap-6 mb-8 last:mb-0"
              >
                {/* Step number and line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: colors.bgSolid }}
                  >
                    {index + 1}
                  </div>
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 mt-2"
                      style={{
                        background: colors.lineFade,
                      }}
                    />
                  )}
                </div>

                {/* Content card */}
                <motion.div
                  className={cn(
                    "flex-1 rounded-2xl p-6",
                    "bg-white/60 dark:bg-gray-900/60",
                    "backdrop-blur-md",
                    "border",
                    "hover:bg-white/80 dark:hover:bg-gray-900/80",
                    "transition-all duration-300"
                  )}
                  style={{
                    borderColor: colors.border,
                    boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)",
                  }}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(59, 130, 246, 0.2), 0 20px 40px -15px rgba(168, 85, 247, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.08), 0 4px 6px -4px rgba(168, 85, 247, 0.08)";
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <Icon className="h-6 w-6" style={{ color: colors.icon }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
