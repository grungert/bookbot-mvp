"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { UseCaseLayout } from "@/components/use-cases";
import { StatsBanner, CaseStudyCard, TestimonialGrid } from "@/components/testimonials";

export function TestimonialsPage() {
  const t = useTranslations("testimonials");
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

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  const caseStudies = [
    {
      title: t("case1Title"),
      industry: t("case1Industry"),
      quote: t("case1Quote"),
      author: t("case1Author"),
      beforeMetric: t("case1Before"),
      afterMetric: t("case1After"),
      improvement: t("case1Metric"),
    },
    {
      title: t("case2Title"),
      industry: t("case2Industry"),
      quote: t("case2Quote"),
      author: t("case2Author"),
      beforeMetric: t("case2Before"),
      afterMetric: t("case2After"),
      improvement: t("case2Metric"),
    },
    {
      title: t("case3Title"),
      industry: t("case3Industry"),
      quote: t("case3Quote"),
      author: t("case3Author"),
      beforeMetric: t("case3Before"),
      afterMetric: t("case3After"),
      improvement: t("case3Metric"),
    },
  ];

  const testimonials = [
    {
      quote: "Setup was incredibly fast. I had my booking page live in under 10 minutes.",
      author: "Lisa M.",
      role: "Owner",
      industry: "Nail Salon",
    },
    {
      quote: "The AI chatbot answers questions better than my staff sometimes. Customers love it.",
      author: "Dr. Robert P.",
      role: "Dentist",
      industry: "Dental Clinic",
    },
    {
      quote: "WhatsApp integration changed everything. My clients book at all hours now.",
      author: "Carlos R.",
      role: "Personal Trainer",
      industry: "Fitness",
    },
    {
      quote: "Finally, no more back-and-forth emails to schedule meetings. Huge time saver.",
      author: "Jennifer K.",
      role: "Business Coach",
      industry: "Consulting",
    },
    {
      quote: "The reminder system alone is worth the price. My no-shows dropped dramatically.",
      author: "Mike T.",
      role: "Barber",
      industry: "Barbershop",
    },
    {
      quote: "I manage 3 locations from my phone now. Everything syncs perfectly.",
      author: "Amanda S.",
      role: "Spa Owner",
      industry: "Spa & Wellness",
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

      {/* Stats Banner */}
      <StatsBanner stats={stats} />

      {/* Case Studies */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2 className="text-3xl font-bold mb-4" variants={itemVariants}>
              {t("caseStudiesTitle")}
            </motion.h2>
            <motion.p className="text-xl text-foreground/80" variants={itemVariants}>
              {t("caseStudiesSubtitle")}
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {caseStudies.map((study, index) => (
              <CaseStudyCard key={index} {...study} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Grid */}
      <TestimonialGrid
        title={t("gridTitle")}
        subtitle={t("gridSubtitle")}
        testimonials={testimonials}
      />

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
