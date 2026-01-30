"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

interface FAQItem {
  question: string;
  answer: string;
}

interface FeatureFAQProps {
  title: string;
  subtitle?: string;
  faqs: FAQItem[];
}

function FAQItemComponent({
  question,
  answer,
  isOpen,
  onToggle,
  delay = 0,
  index = 0,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  delay?: number;
  index?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  // Interpolate between blue and purple based on position
  const getGradientColor = (idx: number, total: number = 5): string => {
    const factor = idx / (total - 1 || 1);
    const r = Math.round(59 + (168 - 59) * factor);
    const g = Math.round(130 + (85 - 130) * factor);
    const b = Math.round(246 + (247 - 246) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const borderColor = getGradientColor(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut",
      }}
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-white/60 dark:bg-gray-900/60",
        "backdrop-blur-md",
        "border border-white/20 dark:border-white/10",
        "shadow-sm",
        isOpen && "border-l-[3px]"
      )}
      style={isOpen ? { borderLeftColor: borderColor } : undefined}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-full px-6 py-4 flex items-center justify-between text-left",
          "hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        )}
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: prefersReducedMotion ? 0 : 0.2 },
              opacity: { duration: prefersReducedMotion ? 0 : 0.15 },
            }}
          >
            <div className="px-6 pb-4 text-muted-foreground">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FeatureFAQ({ title, subtitle, faqs }: FeatureFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-xl text-foreground/80 max-w-2xl mx-auto"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px",
              }}
            >
              {subtitle}
            </p>
          )}
        </ScrollReveal>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItemComponent
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              delay={index * 0.05}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
