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
  isLast?: boolean;
}

function Step({ number, icon: Icon, title, description, delay = 0, isLast = false }: StepProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center">
      {/* Connector Line (hidden on mobile, shown on md+) */}
      {!isLast && (
        <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
      )}

      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.5,
          delay: prefersReducedMotion ? 0 : delay,
          ease: "easeOut",
        }}
        className="flex flex-col items-center text-center max-w-xs"
      >
        {/* Step Number Circle */}
        <div
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center mb-4",
            "bg-primary/20 backdrop-blur-sm",
            "border-2 border-primary/40"
          )}
        >
          <Icon className="h-8 w-8 text-primary" />
          <div
            className={cn(
              "absolute -top-2 -right-2 w-8 h-8 rounded-full",
              "bg-primary text-primary-foreground",
              "flex items-center justify-center",
              "text-sm font-bold shadow-lg"
            )}
          >
            {number}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </motion.div>
    </div>
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
        <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <Step
              key={step.titleKey}
              number={index + 1}
              icon={step.icon}
              title={t(step.titleKey)}
              description={t(step.descKey)}
              delay={index * 0.15}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
