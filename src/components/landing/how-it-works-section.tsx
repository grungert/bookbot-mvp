"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { UserPlus, Settings, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

interface StepProps {
  number: number;
  icon: typeof UserPlus;
  title: string;
  description: string;
  delay?: number;
}

function Step({ number, icon: Icon, title, description, delay = 0 }: StepProps) {
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
      className={cn(
        "flex flex-col items-center text-center p-6 rounded-2xl",
        "bg-white/70 dark:bg-gray-900/70",
        "backdrop-blur-md",
        "border border-white/30 dark:border-white/10"
      )}
      style={{ boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.15), 0 0 15px rgba(59, 130, 246, 0.05)" }}
    >
      {/* Step Number Circle */}
      <div
        className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center mb-4",
          "bg-primary/20",
          "border-2 border-primary/40"
        )}
      >
        <Icon className="h-7 w-7 text-primary" />
        <div
          className={cn(
            "absolute -top-1 -right-1 w-7 h-7 rounded-full",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "text-sm font-bold"
          )}
        >
          {number}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const t = useTranslations("landing");

  const steps = [
    {
      icon: UserPlus,
      titleKey: "howItWorksStep1Title",
      descKey: "howItWorksStep1Desc",
    },
    {
      icon: Settings,
      titleKey: "howItWorksStep2Title",
      descKey: "howItWorksStep2Desc",
    },
    {
      icon: Rocket,
      titleKey: "howItWorksStep3Title",
      descKey: "howItWorksStep3Desc",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("howItWorksTitle")}
          </h2>
          <p
            className="text-xl text-foreground/80 max-w-2xl mx-auto"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("howItWorksSubtitle")}
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <Step
              key={step.titleKey}
              number={index + 1}
              icon={step.icon}
              title={t(step.titleKey)}
              description={t(step.descKey)}
              delay={index * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
