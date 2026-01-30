"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface PainPoint {
  title: string;
  description: string;
}

interface PainPointsProps {
  title: string;
  subtitle: string;
  painPoints: PainPoint[];
}

export function PainPoints({ title, subtitle, painPoints }: PainPointsProps) {
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
    <section className="py-24 bg-red-500/5">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            variants={itemVariants}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-xl text-foreground/80"
            variants={itemVariants}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-xl bg-background/60 backdrop-blur-md border border-red-500/20 hover:border-red-500/40 transition-all duration-300"
              variants={itemVariants}
            >
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{point.title}</h3>
              <p className="text-foreground/70">{point.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
