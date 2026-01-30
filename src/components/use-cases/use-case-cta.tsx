"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface UseCaseCTAProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
}

export function UseCaseCTA({ title, subtitle, ctaText, ctaHref = "/register" }: UseCaseCTAProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
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
            {title}
          </motion.h2>
          <motion.p
            className="text-xl text-foreground/80 mb-8"
            variants={itemVariants}
          >
            {subtitle}
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link href={ctaHref}>
              <Button variant="gradient" size="lg" className="text-lg px-8 py-6">
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
