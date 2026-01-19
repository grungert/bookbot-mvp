"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import dynamic from "next/dynamic";

// Lazy load 3D icon to avoid SSR issues
const Feature3DIcon = dynamic(
  () => import("./feature-3d-icon").then((mod) => mod.Feature3DIcon),
  {
    ssr: false,
    loading: () => (
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 animate-pulse" />
    ),
  }
);

type IconType = "calendar" | "invoice" | "chat";

interface FeatureCardProps {
  iconType: IconType;
  title: string;
  description: string;
  features: string[];
  delay?: number;
}

export function FeatureCard({
  iconType,
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
      <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
        <CardHeader className="space-y-4">
          {/* 3D Icon */}
          <div className="flex justify-center -mt-2 -mb-2">
            <Feature3DIcon type={iconType} />
          </div>

          {/* Title & Description */}
          <div className="text-center">
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
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
        </CardHeader>
      </Card>
    </motion.div>
  );
}
