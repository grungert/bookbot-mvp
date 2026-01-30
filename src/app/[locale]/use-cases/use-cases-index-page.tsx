"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { UseCaseLayout } from "@/components/use-cases";
import { ArrowRight, Scissors, Stethoscope, Dumbbell, Briefcase } from "lucide-react";

const industries = [
  {
    key: "salons",
    href: "/use-cases/salons",
    icon: Scissors,
    color: "from-pink-500 to-rose-500",
    bgColor: "rgba(236, 72, 153, 0.1)",
    iconColor: "rgb(236, 72, 153)",
  },
  {
    key: "clinics",
    href: "/use-cases/clinics",
    icon: Stethoscope,
    color: "from-blue-500 to-cyan-500",
    bgColor: "rgba(59, 130, 246, 0.1)",
    iconColor: "rgb(59, 130, 246)",
  },
  {
    key: "fitness",
    href: "/use-cases/fitness",
    icon: Dumbbell,
    color: "from-green-500 to-emerald-500",
    bgColor: "rgba(34, 197, 94, 0.1)",
    iconColor: "rgb(34, 197, 94)",
  },
  {
    key: "consultants",
    href: "/use-cases/consultants",
    icon: Briefcase,
    color: "from-purple-500 to-violet-500",
    bgColor: "rgba(168, 85, 247, 0.1)",
    iconColor: "rgb(168, 85, 247)",
  },
];

export function UseCasesIndexPage() {
  const t = useTranslations("useCases.index");
  const tNav = useTranslations("nav");
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

      {/* Industry Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2 className="text-3xl font-bold mb-4" variants={itemVariants}>
              {t("exploreTitle")}
            </motion.h2>
            <motion.p className="text-xl text-foreground/80" variants={itemVariants}>
              {t("exploreSubtitle")}
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {industries.map((industry) => {
              const Icon = industry.icon;
              const navKey = `useCases${industry.key.charAt(0).toUpperCase() + industry.key.slice(1)}` as "useCasesSalons" | "useCasesClinics" | "useCasesFitness" | "useCasesConsultants";
              const descKey = `${navKey}Desc` as "useCasesSalonsDesc" | "useCasesClinicsDesc" | "useCasesFitnessDesc" | "useCasesConsultantsDesc";

              return (
                <motion.div key={industry.key} variants={itemVariants}>
                  <Link href={industry.href}>
                    <div className="group p-8 rounded-2xl bg-background/60 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                        style={{ backgroundColor: industry.bgColor }}
                      >
                        <Icon
                          className="w-8 h-8"
                          style={{ color: industry.iconColor }}
                        />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-500 transition-colors">
                        {tNav(navKey)}
                      </h3>
                      <p className="text-foreground/70 mb-4">
                        {tNav(descKey)}
                      </p>
                      <div className="flex items-center text-blue-500 font-medium">
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
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
