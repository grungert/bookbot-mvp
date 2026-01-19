"use client";

import { useTranslations } from "next-intl";
import { PricingCard } from "./pricing-card";
import { ScrollReveal } from "./scroll-reveal";

export function PricingSection() {
  const t = useTranslations("landing");

  const plans = [
    {
      nameKey: "starterPlan",
      priceKey: "starterPrice",
      priceDetailKey: "starterPriceDetail",
      featureKeys: [
        "starterFeature1",
        "starterFeature2",
        "starterFeature3",
        "starterFeature4",
      ],
      isPopular: false,
    },
    {
      nameKey: "proPlan",
      priceKey: "proPrice",
      priceDetailKey: "proPriceDetail",
      featureKeys: [
        "proFeature1",
        "proFeature2",
        "proFeature3",
        "proFeature4",
        "proFeature5",
      ],
      isPopular: true,
    },
    {
      nameKey: "businessPlan",
      priceKey: "businessPrice",
      priceDetailKey: "businessPriceDetail",
      featureKeys: [
        "businessFeature1",
        "businessFeature2",
        "businessFeature3",
        "businessFeature4",
        "businessFeature5",
        "businessFeature6",
      ],
      isPopular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("pricingTitle")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("pricingSubtitle")}
          </p>
        </ScrollReveal>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.nameKey}
              name={t(plan.nameKey)}
              price={t(plan.priceKey)}
              priceDetail={t(plan.priceDetailKey)}
              features={plan.featureKeys.map((key) => t(key))}
              isPopular={plan.isPopular}
              popularLabel={plan.isPopular ? t("mostPopular") : undefined}
              ctaText={t("choosePlan")}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
