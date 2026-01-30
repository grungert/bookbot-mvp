"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Quote } from "lucide-react";

interface IndustryTestimonialProps {
  quote: string;
  author: string;
  role: string;
}

export function IndustryTestimonial({ quote, author, role }: IndustryTestimonialProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = {
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
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={variants}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-8">
            <Quote className="w-8 h-8 text-white" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
            "{quote}"
          </blockquote>
          <div>
            <div className="font-semibold text-lg">{author}</div>
            <div className="text-foreground/60">{role}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
