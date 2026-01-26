import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    // Get subscription counts by plan tier
    const subscriptionsWithPlan = await prisma.userSubscription.findMany({
      include: {
        plan: {
          select: { tier: true },
        },
      },
    });

    const planTierCounts: Record<string, number> = {};
    subscriptionsWithPlan.forEach((sub) => {
      const tier = sub.plan.tier;
      planTierCounts[tier] = (planTierCounts[tier] || 0) + 1;
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

    // Get monthly revenue (sum of active subscriptions)
    const activeSubscriptions = await prisma.userSubscription.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        plan: {
          select: {
            priceMonthly: true,
            extraCompanyPrice: true,
          },
        },
      },
    });

    let monthlyRevenue = 0;
    activeSubscriptions.forEach((sub) => {
      monthlyRevenue += sub.plan.priceMonthly.toNumber();
      if (sub.extraCompanySlots > 0 && sub.plan.extraCompanyPrice) {
        monthlyRevenue +=
          sub.extraCompanySlots * sub.plan.extraCompanyPrice.toNumber();
      }
    });

    // Get trials expiring soon (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const trialsExpiringSoon = await prisma.userSubscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lte: sevenDaysFromNow,
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

    return NextResponse.json({
      totalSubscriptions,
      usersWithoutSubscription,
      monthlyRevenue,
      trialsExpiringSoon,
      totalChatUsageThisMonth: totalChatUsage._sum.tokenCount || 0,
      byStatus: formattedStatusCounts,
      byPlanTier: planTierCounts,
    });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
