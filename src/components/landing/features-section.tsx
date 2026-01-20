"use client";

import { useTranslations } from "next-intl";
import { Calendar, FileText, MessageSquare } from "lucide-react";
import { FeatureCard } from "./feature-card";
import { ScrollReveal } from "./scroll-reveal";

export function FeaturesSection() {
  const t = useTranslations("landing");

  const features = [
    {
      icon: Calendar,
      titleKey: "feature1Title",
      descKey: "feature1Desc",
      pointKeys: ["feature1Point1", "feature1Point2", "feature1Point3"],
    },
    {
      icon: FileText,
      titleKey: "feature2Title",
      descKey: "feature2Desc",
      pointKeys: ["feature2Point1", "feature2Point2", "feature2Point3"],
    },
    {
      icon: MessageSquare,
      titleKey: "feature3Title",
      descKey: "feature3Desc",
      pointKeys: ["feature3Point1", "feature3Point2", "feature3Point3"],
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("featuresTitle")}
          </h2>
          <p
            className="text-xl text-foreground/80 max-w-2xl mx-auto"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("featuresSubtitle")}
          </p>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.titleKey}
              icon={feature.icon}
              title={t(feature.titleKey)}
              description={t(feature.descKey)}
              features={feature.pointKeys.map((key) => t(key))}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
