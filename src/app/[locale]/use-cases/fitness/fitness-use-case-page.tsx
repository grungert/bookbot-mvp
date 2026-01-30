"use client";

import { useTranslations } from "next-intl";
import { Dumbbell, Users, MessageCircle, Target } from "lucide-react";
import {
  UseCaseLayout,
  UseCaseHero,
  PainPoints,
  SolutionShowcase,
  IndustryTestimonial,
  UseCaseCTA,
} from "@/components/use-cases";

export function FitnessUseCasePage() {
  const t = useTranslations("useCases.fitness");

  const painPoints = [
    { title: t("pain1Title"), description: t("pain1Desc") },
    { title: t("pain2Title"), description: t("pain2Desc") },
    { title: t("pain3Title"), description: t("pain3Desc") },
  ];

  const solutions = [
    { icon: Users, title: t("solution1Title"), description: t("solution1Desc") },
    { icon: MessageCircle, title: t("solution2Title"), description: t("solution2Desc") },
    { icon: Target, title: t("solution3Title"), description: t("solution3Desc") },
  ];

  return (
    <UseCaseLayout>
      <UseCaseHero
        icon={Dumbbell}
        badge={t("badge")}
        headline={t("headline")}
        subheadline={t("subheadline")}
        ctaText={t("ctaButton")}
        ctaHref="/register"
      />

      <PainPoints
        title={t("painPointsTitle")}
        subtitle={t("painPointsSubtitle")}
        painPoints={painPoints}
      />

      <SolutionShowcase
        title={t("solutionTitle")}
        subtitle={t("solutionSubtitle")}
        solutions={solutions}
      />

      <IndustryTestimonial
        quote={t("testimonialQuote")}
        author={t("testimonialAuthor")}
        role={t("testimonialRole")}
      />

      <UseCaseCTA
        title={t("ctaTitle")}
        subtitle={t("ctaSubtitle")}
        ctaText={t("ctaButton")}
      />
    </UseCaseLayout>
  );
}
