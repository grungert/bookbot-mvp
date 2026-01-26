import { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription/limits";
import { prisma } from "@/lib/prisma";
import { PricingPageClient } from "./pricing-page-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  // Get plans from database
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
  });

  // Get user's current subscription if logged in
  let currentSubscription = null;
  if (user) {
    const subscription = await getUserSubscription(user.id);
    if (subscription) {
      currentSubscription = {
        planTier: subscription.plan.tier,
        status: subscription.status,
      };
    }
  }

  // Transform plans for the client
  const plansData = plans.map((plan) => ({
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.priceMonthly?.toNumber() ?? 0,
    baseCompanies: plan.baseCompanies,
    maxCompanies: plan.maxCompanies,
    extraCompanyPrice: plan.extraCompanyPrice?.toNumber() ?? null,
    maxChatMessagesPerMonth: plan.maxChatMessagesPerMonth,
    maxChatTokensPerMonth: plan.maxChatTokensPerMonth,
    maxDocumentsPerCompany: plan.maxDocumentsPerCompany,
    customBranding: plan.customBranding,
    prioritySupport: plan.prioritySupport,
    trialDays: plan.trialDays,
  }));

  return (
    <PricingPageClient
      plans={plansData}
      currentSubscription={currentSubscription}
      isLoggedIn={!!user}
    />
  );
}
