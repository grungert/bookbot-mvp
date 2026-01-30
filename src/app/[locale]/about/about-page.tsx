"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Building2, Heart, Clock } from "lucide-react";
import { UseCaseLayout } from "@/components/use-cases";

export function AboutPageComponent() {
  const t = useTranslations("aboutPage");
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0, 0, 0.2, 1] },
    },
  };

  const values = [
    {
      icon: Sparkles,
      title: t("value1Title"),
      description: t("value1Desc"),
    },
    {
      icon: Building2,
      title: t("value2Title"),
      description: t("value2Desc"),
    },
    {
      icon: Heart,
      title: t("value3Title"),
      description: t("value3Desc"),
    },
    {
      icon: Clock,
      title: t("value4Title"),
      description: t("value4Desc"),
    },
  ];

  return (
    <UseCaseLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
              }}
              variants={itemVariants}
            >
              {t("heroTitle")}
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-foreground/80"
              variants={itemVariants}
            >
              {t("heroSubtitle")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-3xl font-bold mb-8 text-center"
              variants={itemVariants}
            >
              {t("storyTitle")}
            </motion.h2>
            <motion.div
              className="space-y-6 text-lg text-foreground/80"
              variants={itemVariants}
            >
              <p>{t("storyP1")}</p>
              <p>{t("storyP2")}</p>
              <p>{t("storyP3")}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2 className="text-3xl font-bold mb-4" variants={itemVariants}>
              {t("valuesTitle")}
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  className="p-6 rounded-xl bg-background/60 backdrop-blur-md border border-white/10"
                  variants={itemVariants}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-foreground/70">{value.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
              }}
              variants={itemVariants}
            >
              {t("ctaTitle")}
            </motion.h2>
            <motion.p
              className="text-xl text-foreground/80 mb-8"
              variants={itemVariants}
            >
              {t("ctaSubtitle")}
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link href="/register">
                <Button variant="gradient" size="lg" className="text-lg px-8 py-6">
                  {t("ctaButton")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </UseCaseLayout>
  );
}
