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

    // Only SUPER_ADMIN or COMPANY_ADMIN can access
    if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get company and verify access
    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
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
    const [subscription, companySlots, chatUsage, trialStatus, documentCount] = await Promise.all([
      getUserSubscription(ownerId),
      getCompanySlots(ownerId),
      getChatUsageStats(ownerId),
      getTrialStatus(ownerId),
      prisma.document.count({ where: { companyId: company.id } }),
    ]);

    if (!subscription) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      status: subscription.status,
      planTier: subscription.plan.tier,
      planName: subscription.plan.name,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
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
      },
      features: {
        customBranding: subscription.plan.customBranding,
        prioritySupport: subscription.plan.prioritySupport,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}
