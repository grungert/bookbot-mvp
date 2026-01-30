"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface UseCaseHeroProps {
  icon: LucideIcon;
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
}

export function UseCaseHero({
  icon: Icon,
  badge,
  headline,
  subheadline,
  ctaText,
  ctaHref,
}: UseCaseHeroProps) {
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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <Badge
              variant="outline"
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30"
            >
              <Icon className="w-4 h-4 mr-2 text-purple-500" />
              {badge}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
            variants={itemVariants}
          >
            {headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            {subheadline}
          </motion.p>

          {/* CTA */}
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
