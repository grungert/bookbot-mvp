import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SUBSCRIPTION_CONSTANTS } from "@/lib/constants/pricing";

// GET /api/super-admin/subscriptions/stats
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get subscription counts by status
    const statusCounts = await prisma.userSubscription.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get subscription counts by plan tier using groupBy aggregation (fixes N+1 query)
    const planTierCountsRaw = await prisma.userSubscription.groupBy({
      by: ["planId"],
      _count: true,
    });

    // Get plan tiers for the planIds
    const planIds = planTierCountsRaw.map((p) => p.planId);
    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, tier: true },
    });

    const planIdToTier = new Map(plans.map((p) => [p.id, p.tier]));

    const planTierCounts: Record<string, number> = {};
    planTierCountsRaw.forEach((item) => {
      const tier = planIdToTier.get(item.planId) || "UNKNOWN";
      planTierCounts[tier] = (planTierCounts[tier] || 0) + item._count;
    });

    // Get total subscriptions
    const totalSubscriptions = await prisma.userSubscription.count();

    // Get users without subscriptions
    const usersWithoutSubscription = await prisma.user.count({
      where: {
        role: "USER",
        subscription: null,
      },
    });

    // Get pricing config for accurate revenue calculation
    const pricingConfigs = await prisma.pricingConfig.findMany({
      where: {
        key: {
          in: ["PRO_BASE", "CHATBOT_ADDON", "EXTRA_COMPANY", "BUSINESS_BASE"],
        },
      },
    });

    const pricing: Record<string, number> = {};
    pricingConfigs.forEach((config) => {
      pricing[config.key] = config.priceEurCents / 100; // Convert cents to euros
    });

    // Get monthly revenue (sum of active subscriptions using PricingConfig)
    const activeSubscriptions = await prisma.userSubscription.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        plan: {
          select: {
            tier: true,
          },
        },
      },
    });

    let subscriptionRevenue = 0;
    activeSubscriptions.forEach((sub) => {
      if (sub.plan.tier === "BUSINESS") {
        subscriptionRevenue += pricing.BUSINESS_BASE || 0;
      } else if (sub.plan.tier === "PRO") {
        subscriptionRevenue += pricing.PRO_BASE || 0;
        if (sub.hasChatbot) {
          subscriptionRevenue += pricing.CHATBOT_ADDON || 0;
        }
        if (sub.extraCompanySlots > 0) {
          subscriptionRevenue += sub.extraCompanySlots * (pricing.EXTRA_COMPANY || 0);
        }
      }
      // TRIAL tier has no revenue
    });

    // Get trials expiring soon (use constant instead of hardcoded value #20)
    const now = new Date();
    const warningDays = SUBSCRIPTION_CONSTANTS.TRIAL_EXPIRY_WARNING_DAYS;
    const warningWindowEnd = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

    const trialsExpiringSoon = await prisma.userSubscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lte: warningWindowEnd,
        },
      },
    });

    // Get this month's chat usage totals
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const totalChatUsage = await prisma.chatUsage.aggregate({
      where: {
        periodStart,
      },
      _sum: {
        messageCount: true,
        tokenCount: true,
      },
    });

    // Format status counts
    const formattedStatusCounts: Record<string, number> = {
      TRIALING: 0,
      ACTIVE: 0,
      TRIAL_EXPIRED: 0,
      PAST_DUE: 0,
      CANCELLED: 0,
    };
    statusCounts.forEach((sc) => {
      formattedStatusCounts[sc.status] = sc._count;
    });

    // Get token purchase stats (approved purchases only)
    const tokenPurchaseStats = await prisma.tokenPurchase.aggregate({
      where: {
        status: "APPROVED",
      },
      _sum: {
        tokenAmount: true,
        priceEurCents: true,
      },
      _count: true,
    });

    // Include token revenue in total monthly revenue (#10)
    const tokenRevenueEur = (tokenPurchaseStats._sum.priceEurCents || 0) / 100;
    const monthlyRevenue = subscriptionRevenue + tokenRevenueEur;

    return NextResponse.json({
      totalSubscriptions,
      usersWithoutSubscription,
      monthlyRevenue,
      trialsExpiringSoon,
      totalChatUsageThisMonth: totalChatUsage._sum.tokenCount || 0,
      byStatus: formattedStatusCounts,
      byPlanTier: planTierCounts,
      // Token purchase stats
      totalTokensPurchased: tokenPurchaseStats._sum.tokenAmount || 0,
      tokenRevenueCents: tokenPurchaseStats._sum.priceEurCents || 0,
      tokenPurchaseCount: tokenPurchaseStats._count || 0,
    });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
