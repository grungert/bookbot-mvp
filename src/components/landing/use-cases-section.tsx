"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Scissors, Stethoscope, Briefcase, Dumbbell, Sparkles, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

interface UseCaseItemProps {
  icon: typeof Scissors;
  label: string;
  delay?: number;
  index?: number;
}

// Interpolate between blue (#3b82f6) and purple (#a855f7) based on position
function getGradientColor(index: number, totalItems: number = 6): { bg: string; icon: string } {
  // For a single row of items, factor goes from 0 (blue) to 1 (purple)
  const factor = index / (totalItems - 1);
  const clampedFactor = Math.max(0, Math.min(1, factor));

  // Blue: rgb(59, 130, 246) - Purple: rgb(168, 85, 247)
  const r = Math.round(59 + (168 - 59) * clampedFactor);
  const g = Math.round(130 + (85 - 130) * clampedFactor);
  const b = Math.round(246 + (247 - 246) * clampedFactor);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.3)`,
    icon: `rgb(${r}, ${g}, ${b})`
  };
}

function UseCaseItem({ icon: Icon, label, delay = 0, index = 0 }: UseCaseItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const colors = getGradientColor(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut",
      }}
      className={cn(
        "group flex items-center gap-3 px-5 py-3 rounded-full",
        "bg-white/70 dark:bg-gray-900/70",
        "border border-white/30 dark:border-white/10",
        "hover:-translate-y-1 hover:bg-white/95 dark:hover:bg-gray-900/95",
        "transition-all duration-200"
      )}
      style={{
        boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.06), 0 2px 4px -2px rgba(168, 85, 247, 0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(59, 130, 246, 0.18), 0 8px 20px -6px rgba(168, 85, 247, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(59, 130, 246, 0.06), 0 2px 4px -2px rgba(168, 85, 247, 0.06)";
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon className="h-4 w-4" style={{ color: colors.icon }} />
      </div>
      <span className="font-medium text-sm whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

export function UseCasesSection() {
  const t = useTranslations("landing");

  const useCases = [
    { icon: Scissors, labelKey: "useCaseSalon" },
    { icon: Stethoscope, labelKey: "useCaseClinic" },
    { icon: Briefcase, labelKey: "useCaseConsultant" },
    { icon: Dumbbell, labelKey: "useCaseFitness" },
    { icon: Sparkles, labelKey: "useCaseBeauty" },
    { icon: Camera, labelKey: "useCasePhoto" },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-10">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("useCasesTitle")}
          </h2>
          <p
            className="text-xl text-foreground/80 max-w-2xl mx-auto"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("useCasesSubtitle")}
          </p>
        </ScrollReveal>

        {/* Use Cases - Horizontal Pills */}
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {useCases.map((useCase, index) => (
            <UseCaseItem
              key={useCase.labelKey}
              icon={useCase.icon}
              label={t(useCase.labelKey)}
              delay={index * 0.05}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
