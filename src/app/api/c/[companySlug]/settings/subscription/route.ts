import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { prisma } from "@/lib/prisma";
import { getUserSubscription, getCompanySlots } from "@/lib/subscription/limits";
import { getChatUsageStats } from "@/lib/subscription/usage";
import { getTrialStatus } from "@/lib/subscription/trial";

interface RouteContext {
  params: Promise<{ companySlug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { companySlug } = await context.params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company and verify access
    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user has admin access to this company (via membership)
    const userMembership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });
    const isCompanyAdmin = user.role === "SUPER_ADMIN" || !!userMembership;

    if (!isCompanyAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the company owner's subscription
    const ownerMembership = await prisma.companyMembership.findFirst({
      where: {
        companyId: company.id,
        role: "OWNER",
      },
      select: { userId: true },
    });

    if (!ownerMembership) {
      return NextResponse.json({ error: "Company owner not found" }, { status: 404 });
    }

    const ownerId = ownerMembership.userId;

    // Get subscription data in parallel
    const [subscription, companySlots, chatUsage, trialStatus, documentCount, pricingConfigs] = await Promise.all([
      getUserSubscription(ownerId),
      getCompanySlots(ownerId),
      getChatUsageStats(ownerId),
      getTrialStatus(ownerId),
      prisma.document.count({ where: { companyId: company.id } }),
      prisma.pricingConfig.findMany({ where: { isActive: true, key: { in: ["CHATBOT_ADDON", "EXTRA_COMPANY"] } } }),
    ]);

    // Extract pricing from config
    const chatbotAddonPricing = pricingConfigs.find(p => p.key === "CHATBOT_ADDON");
    const extraCompanyPricing = pricingConfigs.find(p => p.key === "EXTRA_COMPANY");

    if (!subscription) {
      return NextResponse.json(null);
    }

    // Get all companies owned by this user with service counts
    const companiesWithServices = await prisma.companyMembership.findMany({
      where: {
        userId: ownerId,
        role: "OWNER",
      },
      include: {
        company: {
          include: {
            _count: {
              select: { services: true },
            },
          },
        },
      },
    });

    const companies = companiesWithServices.map((membership) => ({
      id: membership.company.id,
      name: membership.company.name,
      slug: membership.company.slug,
      serviceCount: membership.company._count.services,
    }));

    // Chatbot is available if:
    // 1. Plan is BUSINESS (always included)
    // 2. Plan is PRO with hasChatbot addon
    // 3. User is in trial period (trial includes all features)
    const hasChatbotAccess =
      subscription.plan.tier === "BUSINESS" ||
      subscription.hasChatbot ||
      (subscription.status === "TRIALING" && !trialStatus.isExpired);

    return NextResponse.json({
      status: subscription.status,
      planTier: subscription.plan.tier,
      planName: subscription.plan.name,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      extraCompanySlots: subscription.extraCompanySlots,
      daysRemaining: trialStatus.daysRemaining,
      chatUsage: {
        used: chatUsage.currentPeriod.used,
        limit: chatUsage.currentPeriod.limit,
        unlimited: chatUsage.currentPeriod.unlimited,
        resetsAt: chatUsage.currentPeriod.end.toISOString(),
      },
      documentUsage: {
        current: documentCount,
        limit: subscription.plan.maxDocumentsPerCompany ?? -1,
        unlimited: subscription.plan.maxDocumentsPerCompany === null || subscription.plan.maxDocumentsPerCompany === -1,
      },
      companySlots: {
        used: companySlots.usedSlots,
        total: companySlots.totalSlots,
        unlimited: companySlots.unlimited,
        available: companySlots.availableSlots,
      },
      features: {
        customBranding: subscription.plan.customBranding,
        prioritySupport: subscription.plan.prioritySupport,
        aiChatbot: hasChatbotAccess,
      },
      plan: {
        maxDocumentsPerCompany: subscription.plan.maxDocumentsPerCompany,
        extraCompanyPrice: extraCompanyPricing?.priceEurCents ?? 699, // Default to €6.99 (699 cents)
        chatbotAddonPrice: chatbotAddonPricing?.priceEurCents ?? 999, // Default to €9.99 (999 cents)
      },
      companies,
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}
