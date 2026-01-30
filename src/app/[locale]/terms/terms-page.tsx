"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { UseCaseLayout } from "@/components/use-cases";

interface TermsPageProps {
  legalEmail: string;
}

export function TermsPageComponent({ legalEmail }: TermsPageProps) {
  const t = useTranslations("legal.terms");
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
    { title: t("acceptTitle"), content: t("acceptText") },
    { title: t("serviceTitle"), content: t("serviceText") },
    { title: t("accountTitle"), content: t("accountText") },
    { title: t("useTitle"), content: t("useText") },
    { title: t("paymentTitle"), content: t("paymentText") },
    { title: t("terminationTitle"), content: t("terminationText") },
    { title: t("limitationTitle"), content: t("limitationText") },
    { title: t("changesTitle"), content: t("changesText") },
    { title: t("contactTitle"), content: t("contactText", { email: legalEmail }) },
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
