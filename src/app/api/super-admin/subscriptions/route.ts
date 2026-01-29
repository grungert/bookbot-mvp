import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/super-admin/subscriptions - List all subscriptions with user and plan details
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const planTier = searchParams.get("planTier");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (planTier) {
      where.plan = { tier: planTier };
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.userSubscription.count({ where });

    const subscriptions = await prisma.userSubscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            tier: true,
            priceMonthly: true,
            maxChatMessagesPerMonth: true,
            maxChatTokensPerMonth: true,
            baseCompanies: true,
            maxCompanies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get company counts for each user
    const userIds = subscriptions.map((s) => s.userId);
    const companyCounts = await prisma.companyMembership.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        role: "OWNER",
      },
      _count: true,
    });

    const companyCountMap = new Map(
      companyCounts.map((c) => [c.userId, c._count])
    );

    // Get current month chat usage for each user
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const chatUsages = await prisma.chatUsage.findMany({
      where: {
        userId: { in: userIds },
        periodStart,
      },
      select: {
        userId: true,
        messageCount: true,
        tokenCount: true,
      },
    });

    const chatUsageMap = new Map(
      chatUsages.map((u) => [u.userId, u.tokenCount])
    );

    // Format response
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      user: {
        id: sub.user.id,
        email: sub.user.email,
        name: sub.user.name,
        role: sub.user.role,
        createdAt: sub.user.createdAt,
      },
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        tier: sub.plan.tier,
        priceMonthly: sub.plan.priceMonthly.toNumber(),
        maxChatMessagesPerMonth: sub.plan.maxChatMessagesPerMonth,
        maxChatTokensPerMonth: sub.plan.maxChatTokensPerMonth,
        baseCompanies: sub.plan.baseCompanies,
        maxCompanies: sub.plan.maxCompanies,
      },
      status: sub.status,
      extraCompanySlots: sub.extraCompanySlots,
      hasChatbot: sub.hasChatbot,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      notes: sub.notes,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      // Computed fields
      companyCount: companyCountMap.get(sub.userId) || 0,
      chatUsageThisMonth: chatUsageMap.get(sub.userId) || 0,
    }));

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
