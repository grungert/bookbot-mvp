import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { LandingPage } from "@/components/landing/landing-page";
import { DEFAULT_PRICING } from "@/lib/constants/pricing";
import type { PublicPlan } from "@/app/api/plans/route";

export interface PricingConfig {
  PRO_BASE: number;
  CHATBOT_ADDON: number;
  EXTRA_COMPANY: number;
  BUSINESS_BASE: number;
}

export interface TokenPack {
  id: string;
  name: string;
  tokenAmount: number;
  priceEurCents: number;
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch active plans, pricing config, and token packs in parallel
  const [plans, pricingConfigs, tokenPacksRaw] = await Promise.all([
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
      select: {
        id: true,
        tier: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceCurrency: true,
        baseCompanies: true,
        maxCompanies: true,
        extraCompanyPrice: true,
        maxChatTokensPerMonth: true,
        maxDocumentsPerCompany: true,
        customBranding: true,
        prioritySupport: true,
        trialDays: true,
      },
    }),
    prisma.pricingConfig.findMany({
      where: { isActive: true },
      select: { key: true, priceEurCents: true },
    }),
    prisma.tokenPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        tokenAmount: true,
        priceEurCents: true,
      },
    }),
  ]);

  // Transform Decimal fields to numbers for client component
  const plansData: PublicPlan[] = plans.map((plan) => ({
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.priceMonthly?.toNumber() ?? 0,
    priceCurrency: plan.priceCurrency,
    baseCompanies: plan.baseCompanies,
    maxCompanies: plan.maxCompanies,
    extraCompanyPrice: plan.extraCompanyPrice?.toNumber() ?? null,
    maxChatTokensPerMonth: plan.maxChatTokensPerMonth,
    maxDocumentsPerCompany: plan.maxDocumentsPerCompany,
    customBranding: plan.customBranding,
    prioritySupport: plan.prioritySupport,
    trialDays: plan.trialDays,
  }));

  // Build pricing config from database with fallbacks
  const pricing: PricingConfig = { ...DEFAULT_PRICING };
  for (const config of pricingConfigs) {
    if (config.key in pricing) {
      pricing[config.key as keyof PricingConfig] = config.priceEurCents;
    }
  }

  // Token packs data
  const tokenPacks: TokenPack[] = tokenPacksRaw.map((pack) => ({
    id: pack.id,
    name: pack.name,
    tokenAmount: pack.tokenAmount,
    priceEurCents: pack.priceEurCents,
  }));

  return <LandingPage plans={plansData} pricing={pricing} tokenPacks={tokenPacks} />;
}
