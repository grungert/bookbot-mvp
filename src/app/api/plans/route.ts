import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface PublicPlan {
  id: string;
  tier: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceCurrency: string;
  baseCompanies: number;
  maxCompanies: number;
  extraCompanyPrice: number | null;
  maxChatTokensPerMonth: number;
  maxDocumentsPerCompany: number | null;
  customBranding: boolean;
  prioritySupport: boolean;
  trialDays: number | null;
}

// Public endpoint to fetch active plans for landing page
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
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
    });

    // Transform Decimal fields to numbers for JSON serialization
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

    return NextResponse.json({ plans: plansData });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ plans: [] }, { status: 500 });
  }
}
