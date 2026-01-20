"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  delay?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  delay = 0,
}: FeatureCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut",
      }}
    >
      {/* Glass Card */}
      <div
        className={cn(
          "group h-full rounded-xl p-6",
          "bg-white/60 dark:bg-gray-900/60",
          "backdrop-blur-md",
          "border border-white/20 dark:border-white/10",
          "hover:-translate-y-1 hover:bg-white/70 dark:hover:bg-gray-900/70",
          "transition-all duration-300"
        )}
        style={{ boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.15), 0 0 15px rgba(59, 130, 246, 0.05)" }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(59, 130, 246, 0.25), 0 0 20px rgba(59, 130, 246, 0.1)"}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(59, 130, 246, 0.15), 0 0 15px rgba(59, 130, 246, 0.05)"}
      >
        <div className="space-y-4">
          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "bg-primary/20 backdrop-blur-sm",
              "group-hover:bg-primary/30 transition-colors"
            )}
          >
            <Icon className="h-7 w-7 text-primary" />
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {/* Feature List */}
          <div className="space-y-2 pt-2">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.3,
                  delay: prefersReducedMotion ? 0 : delay + 0.1 + index * 0.1,
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
