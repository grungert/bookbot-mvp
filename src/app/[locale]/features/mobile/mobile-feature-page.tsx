"use client";

import { useTranslations } from "next-intl";
import {
  Smartphone,
  Bell,
  Calendar,
  Zap,
  Layout,
  Eye,
  RefreshCw,
  Coffee,
  Plane,
  HeartPulse,
} from "lucide-react";
import {
  FeatureLayout,
  FeatureHero,
  BenefitsGrid,
  HowItWorks,
  UseCases,
  PricingCallout,
  FeatureFAQ,
  FeatureCTA,
} from "@/components/features";

export function MobileFeaturePage() {
  const t = useTranslations("features.mobile");

  const benefits = [
    {
      icon: Layout,
      title: t("benefit1Title"),
      description: t("benefit1Desc"),
    },
    {
      icon: Bell,
      title: t("benefit2Title"),
      description: t("benefit2Desc"),
    },
    {
      icon: Calendar,
      title: t("benefit3Title"),
      description: t("benefit3Desc"),
    },
    {
      icon: Zap,
      title: t("benefit4Title"),
      description: t("benefit4Desc"),
    },
  ];

  const steps = [
    {
      icon: Smartphone,
      title: t("step1Title"),
      description: t("step1Desc"),
    },
    {
      icon: Eye,
      title: t("step2Title"),
      description: t("step2Desc"),
    },
    {
      icon: RefreshCw,
      title: t("step3Title"),
      description: t("step3Desc"),
    },
    {
      icon: Bell,
      title: t("step4Title"),
      description: t("step4Desc"),
    },
  ];

  const useCases = [
    {
      icon: Coffee,
      title: t("useCase1Title"),
      description: t("useCase1Desc"),
      example: t("useCase1Example"),
    },
    {
      icon: Plane,
      title: t("useCase2Title"),
      description: t("useCase2Desc"),
      example: t("useCase2Example"),
    },
    {
      icon: HeartPulse,
      title: t("useCase3Title"),
      description: t("useCase3Desc"),
      example: t("useCase3Example"),
    },
  ];

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
  ];

  return (
    <FeatureLayout>
      <FeatureHero
        icon={Smartphone}
        badge={t("badge")}
        headline={t("headline")}
        subheadline={t("subheadline")}
        ctaText={t("ctaText")}
        ctaHref="/register"
        secondaryCta={{
          text: t("secondaryCta"),
          href: "/pricing",
        }}
      />

      <BenefitsGrid
        title={t("benefitsTitle")}
        subtitle={t("benefitsSubtitle")}
        benefits={benefits}
      />

      <HowItWorks
        title={t("howItWorksTitle")}
        subtitle={t("howItWorksSubtitle")}
        steps={steps}
      />

      <UseCases
        title={t("useCasesTitle")}
        subtitle={t("useCasesSubtitle")}
        perfectFor={t("perfectFor")}
        useCases={useCases}
      />

      <PricingCallout
        title={t("pricingTitle")}
        subtitle={t("pricingSubtitle")}
        plan={t("pricingPlan")}
        features={[
          t("pricingFeature1"),
          t("pricingFeature2"),
          t("pricingFeature3"),
        ]}
        ctaText={t("pricingCta")}
        ctaHref="/pricing"
      />

      <FeatureFAQ
        title={t("faqTitle")}
        subtitle={t("faqSubtitle")}
        faqs={faqs}
      />

      <FeatureCTA
        title={t("finalCtaTitle")}
        subtitle={t("finalCtaSubtitle")}
        ctaText={t("finalCtaButton")}
        ctaHref="/register"
        secondaryText={t("finalCtaSecondary")}
      />
    </FeatureLayout>
  );
}
