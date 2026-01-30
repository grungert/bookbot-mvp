"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CheckCircle, type LucideIcon } from "lucide-react";

interface Solution {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface SolutionShowcaseProps {
  title: string;
  subtitle: string;
  solutions: Solution[];
}

function getGradientColor(index: number, totalItems: number) {
  const factor = index / (totalItems - 1 || 1);
  const r = Math.round(59 + (168 - 59) * factor);
  const g = Math.round(130 + (85 - 130) * factor);
  const b = Math.round(246 + (247 - 246) * factor);
  return { bg: `rgba(${r}, ${g}, ${b}, 0.15)`, icon: `rgb(${r}, ${g}, ${b})` };
}

export function SolutionShowcase({ title, subtitle, solutions }: SolutionShowcaseProps) {
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
    <section className="py-24">
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
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
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
          {solutions.map((solution, index) => {
            const colors = getGradientColor(index, solutions.length);
            const Icon = solution.icon;
            return (
              <motion.div
                key={index}
                className="p-6 rounded-xl bg-background/60 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                variants={itemVariants}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon className="w-6 h-6" style={{ color: colors.icon }} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{solution.title}</h3>
                <p className="text-foreground/70">{solution.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
