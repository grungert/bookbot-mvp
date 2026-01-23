import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription, getCompanySlots } from "@/lib/subscription/limits";
import { getChatUsageStats } from "@/lib/subscription/usage";
import { getTrialStatus } from "@/lib/subscription/trial";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all subscription data in parallel
    const [subscription, companySlots, chatUsage, trialStatus] = await Promise.all([
      getUserSubscription(user.id),
      getCompanySlots(user.id),
      getChatUsageStats(user.id),
      getTrialStatus(user.id),
    ]);

    // Get document count for each company
    const companiesWithDocs = await prisma.companyMembership.findMany({
      where: {
        userId: user.id,
        role: "OWNER",
      },
      include: {
        company: {
          include: {
            _count: {
              select: { documents: true },
            },
          },
        },
      },
    });

    const companies = companiesWithDocs.map((membership) => ({
      id: membership.company.id,
      name: membership.company.name,
      slug: membership.company.slug,
      documentCount: membership.company._count.documents,
    }));

    // Prepare response data
    const subscriptionData = subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          planTier: subscription.plan.tier,
          planName: subscription.plan.name,
          trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
          currentPeriodStart: subscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          extraCompanySlots: subscription.extraCompanySlots,
          plan: {
            baseCompanies: subscription.plan.baseCompanies,
            maxCompanies: subscription.plan.maxCompanies,
            extraCompanyPrice: subscription.plan.extraCompanyPrice,
            maxChatMessagesPerMonth: subscription.plan.maxChatMessagesPerMonth,
            maxDocumentsPerCompany: subscription.plan.maxDocumentsPerCompany,
            customBranding: subscription.plan.customBranding,
            prioritySupport: subscription.plan.prioritySupport,
          },
        }
      : null;

    return NextResponse.json({
      subscription: subscriptionData,
      companySlots,
      chatUsage: {
        currentPeriod: {
          ...chatUsage.currentPeriod,
          start: chatUsage.currentPeriod.start.toISOString(),
          end: chatUsage.currentPeriod.end.toISOString(),
        },
        history: chatUsage.history.map((h) => ({
          periodStart: h.periodStart.toISOString(),
          periodEnd: h.periodEnd.toISOString(),
          messageCount: h.messageCount,
        })),
      },
      trialStatus: {
        isTrialing: trialStatus.isTrialing,
        isExpired: trialStatus.isExpired,
        daysRemaining: trialStatus.daysRemaining,
      },
      companies,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}
