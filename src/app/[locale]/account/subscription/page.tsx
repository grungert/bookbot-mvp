import { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSubscription, getCompanySlots } from "@/lib/subscription/limits";
import { getChatUsageStats } from "@/lib/subscription/usage";
import { getTrialStatus } from "@/lib/subscription/trial";
import { prisma } from "@/lib/prisma";
import { SubscriptionDashboardClient } from "./subscription-dashboard-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("subscriptionTitle"),
  };
}

interface SubscriptionPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
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

  // Prepare data for client
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
          priceMonthly: 0, // We'll use translations for prices
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

  return (
    <SubscriptionDashboardClient
      subscription={subscriptionData}
      companySlots={companySlots}
      chatUsage={{
        currentPeriod: {
          ...chatUsage.currentPeriod,
          start: chatUsage.currentPeriod.start.toISOString(),
          end: chatUsage.currentPeriod.end.toISOString(),
        },
      }}
      trialStatus={{
        isTrialing: trialStatus.isTrialing,
        isExpired: trialStatus.isExpired,
        daysRemaining: trialStatus.daysRemaining,
      }}
      companies={companies}
    />
  );
}
