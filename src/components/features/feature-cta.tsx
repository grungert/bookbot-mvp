"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

interface FeatureCTAProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
  secondaryText?: string;
}

export function FeatureCTA({
  title,
  subtitle,
  ctaText,
  ctaHref = "/register",
  secondaryText = "No credit card required",
}: FeatureCTAProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-purple-500/15" />

      {/* Animated Background Elements */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          {/* Glass Card */}
          <div className="rounded-2xl p-8 md:p-12 text-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl shadow-black/5">
            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{title}</h2>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground mb-8">{subtitle}</p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.3,
                delay: prefersReducedMotion ? 0 : 0.2,
              }}
            >
              <Link href={ctaHref}>
                <Button
                  variant="gradient"
                  size="lg"
                  className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  {ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badge */}
            <motion.div
              className="mt-8 flex items-center justify-center gap-2 text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.3,
                delay: prefersReducedMotion ? 0 : 0.4,
              }}
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm">{secondaryText}</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
