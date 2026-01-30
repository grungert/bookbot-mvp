"use client";

import { useTranslations } from "next-intl";
import {
  MessageCircle,
  Clock,
  Bell,
  Globe2,
  Smartphone,
  Calendar,
  MessageSquare,
  CheckCircle,
  Scissors,
  Stethoscope,
  Briefcase,
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

export function WhatsAppFeaturePage() {
  const t = useTranslations("features.whatsapp");

  const benefits = [
    {
      icon: Clock,
      title: t("benefit1Title"),
      description: t("benefit1Desc"),
    },
    {
      icon: MessageSquare,
      title: t("benefit2Title"),
      description: t("benefit2Desc"),
    },
    {
      icon: Bell,
      title: t("benefit3Title"),
      description: t("benefit3Desc"),
    },
    {
      icon: Globe2,
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
      icon: MessageCircle,
      title: t("step2Title"),
      description: t("step2Desc"),
    },
    {
      icon: Calendar,
      title: t("step3Title"),
      description: t("step3Desc"),
    },
    {
      icon: CheckCircle,
      title: t("step4Title"),
      description: t("step4Desc"),
    },
  ];

  const useCases = [
    {
      icon: Scissors,
      title: t("useCase1Title"),
      description: t("useCase1Desc"),
      example: t("useCase1Example"),
    },
    {
      icon: Stethoscope,
      title: t("useCase2Title"),
      description: t("useCase2Desc"),
      example: t("useCase2Example"),
    },
    {
      icon: Briefcase,
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
    { question: t("faq5Q"), answer: t("faq5A") },
  ];

  return (
    <FeatureLayout>
      <FeatureHero
        icon={MessageCircle}
        badge={t("badge")}
        headline={t("headline")}
        subheadline={t("subheadline")}
        ctaText={t("ctaText")}
        ctaHref="/register"
        secondaryCta={{
          text: t("secondaryCta"),
          href: "/#pricing",
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
        ctaHref="/#pricing"
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
