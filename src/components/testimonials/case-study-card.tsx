"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Quote, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CaseStudyCardProps {
  title: string;
  industry: string;
  quote: string;
  author: string;
  beforeMetric: string;
  afterMetric: string;
  improvement: string;
}

export function CaseStudyCard({
  title,
  industry,
  quote,
  author,
  beforeMetric,
  afterMetric,
  improvement,
}: CaseStudyCardProps) {
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
    <motion.div
      className="p-8 rounded-2xl bg-background/60 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-1">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {industry}
          </Badge>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Quote className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Quote */}
      <blockquote className="text-lg text-foreground/80 mb-6 italic">
        "{quote}"
      </blockquote>
      <p className="text-sm text-foreground/60 mb-6">— {author}</p>

      {/* Metrics */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="text-center flex-1">
          <div className="text-sm text-foreground/60 mb-1">Before</div>
          <div className="text-lg font-semibold text-red-500">{beforeMetric}</div>
        </div>
        <ArrowRight className="w-5 h-5 text-foreground/40" />
        <div className="text-center flex-1">
          <div className="text-sm text-foreground/60 mb-1">After</div>
          <div className="text-lg font-semibold text-green-500">{afterMetric}</div>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center flex-1">
          <div className="text-sm text-foreground/60 mb-1">Result</div>
          <div className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {improvement}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
