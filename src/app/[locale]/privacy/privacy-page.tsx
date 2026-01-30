"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { UseCaseLayout } from "@/components/use-cases";

interface PrivacyPageProps {
  privacyEmail: string;
}

export function PrivacyPageComponent({ privacyEmail }: PrivacyPageProps) {
  const t = useTranslations("legal.privacy");
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: [0, 0, 0.2, 1] },
    },
  };

  const sections = [
    { title: t("introTitle"), content: t("introText") },
    { title: t("collectTitle"), content: t("collectText") },
    { title: t("useTitle"), content: t("useText") },
    { title: t("shareTitle"), content: t("shareText") },
    { title: t("securityTitle"), content: t("securityText") },
    { title: t("rightsTitle"), content: t("rightsText") },
    { title: t("contactTitle"), content: t("contactText", { email: privacyEmail }) },
  ];

  return (
    <UseCaseLayout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-center"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
              }}
              variants={itemVariants}
            >
              {t("title")}
            </motion.h1>
            <motion.p
              className="text-foreground/60 text-center mb-12"
              variants={itemVariants}
            >
              {t("lastUpdated")}
            </motion.p>

            <motion.div
              className="p-8 rounded-2xl bg-background/60 backdrop-blur-md border border-white/10"
              variants={itemVariants}
            >
              <div className="space-y-8">
                {sections.map((section, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                    <p className="text-foreground/70 leading-relaxed">{section.content}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </UseCaseLayout>
  );
}
