import { prisma } from "@/lib/prisma";
import { PlanTier, SubscriptionStatus } from "@prisma/client";

export interface SubscriptionWithPlan {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  extraCompanySlots: number;
  hasChatbot: boolean;
  bonusTokenBalance: number;
  trialEndsAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: {
    id: string;
    name: string;
    tier: PlanTier;
    baseCompanies: number;
    maxCompanies: number;
    extraCompanyPrice: number | null;
    maxChatMessagesPerMonth: number;
    maxChatTokensPerMonth: number;
    maxDocumentsPerCompany: number | null;
    customBranding: boolean;
    prioritySupport: boolean;
  };
}

/**
 * Get user's subscription with plan details
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionWithPlan | null> {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          tier: true,
          baseCompanies: true,
          maxCompanies: true,
          extraCompanyPrice: true,
          maxChatMessagesPerMonth: true,
          maxChatTokensPerMonth: true,
          maxDocumentsPerCompany: true,
          customBranding: true,
          prioritySupport: true,
        },
      },
    },
  });

  if (!subscription) return null;

  return {
    ...subscription,
    bonusTokenBalance: subscription.bonusTokenBalance ?? 0,
    plan: {
      ...subscription.plan,
      extraCompanyPrice: subscription.plan.extraCompanyPrice?.toNumber() ?? null,
    },
  };
}

/**
 * Get how many companies a user can have
 * Returns { base, extra, total, current }
 */
export async function getCompanySlots(userId: string): Promise<{
  baseSlots: number;
  extraSlots: number;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  unlimited: boolean;
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    // No subscription - allow 1 company (free tier fallback)
    const usedSlots = await prisma.companyMembership.count({
      where: { userId, role: "OWNER" },
    });

    return {
      baseSlots: 1,
      extraSlots: 0,
      totalSlots: 1,
      usedSlots,
      availableSlots: Math.max(0, 1 - usedSlots),
      unlimited: false,
    };
  }

  const { plan, extraCompanySlots } = subscription;
  const unlimited = plan.baseCompanies === -1 || plan.maxCompanies === -1;

  const usedSlots = await prisma.companyMembership.count({
    where: { userId, role: "OWNER" },
  });

  if (unlimited) {
    return {
      baseSlots: -1,
      extraSlots: extraCompanySlots,
      totalSlots: -1,
      usedSlots,
      availableSlots: -1, // Unlimited
      unlimited: true,
    };
  }

  const totalSlots = plan.baseCompanies + extraCompanySlots;
  return {
    baseSlots: plan.baseCompanies,
    extraSlots: extraCompanySlots,
    totalSlots,
    usedSlots,
    availableSlots: Math.max(0, totalSlots - usedSlots),
    unlimited: false,
  };
}

export interface CanCreateCompanyResult {
  allowed: boolean;
  reason: string | null;
  currentCompanies: number;
  maxCompanies: number;
  canAddSlots: boolean;
  extraSlotPrice: number | null;
  upgradeUrl: string;
}

/**
 * Check if user can create another company
 */
export async function canCreateCompany(
  userId: string
): Promise<CanCreateCompanyResult> {
  const subscription = await getUserSubscription(userId);
  const slots = await getCompanySlots(userId);

  // No subscription
  if (!subscription) {
    return {
      allowed: slots.usedSlots < 1,
      reason: slots.usedSlots >= 1 ? "Company limit reached" : null,
      currentCompanies: slots.usedSlots,
      maxCompanies: 1,
      canAddSlots: false,
      extraSlotPrice: null,
      upgradeUrl: "/pricing",
    };
  }

  // Check if subscription is active
  const activeStatuses: SubscriptionStatus[] = ["TRIALING", "ACTIVE"];
  if (!activeStatuses.includes(subscription.status)) {
    return {
      allowed: false,
      reason:
        subscription.status === "TRIAL_EXPIRED"
          ? "Trial period has ended"
          : "Subscription not active",
      currentCompanies: slots.usedSlots,
      maxCompanies: slots.totalSlots,
      canAddSlots: false,
      extraSlotPrice: null,
      upgradeUrl: "/pricing",
    };
  }

  // Unlimited companies
  if (slots.unlimited) {
    return {
      allowed: true,
      reason: null,
      currentCompanies: slots.usedSlots,
      maxCompanies: -1,
      canAddSlots: false,
      extraSlotPrice: null,
      upgradeUrl: "/pricing",
    };
  }

  // Check if at limit
  if (slots.usedSlots >= slots.totalSlots) {
    // Can they add more slots?
    const { plan } = subscription;
    const canAddMore =
      plan.extraCompanyPrice !== null &&
      (plan.maxCompanies === -1 || slots.totalSlots < plan.maxCompanies);

    return {
      allowed: false,
      reason: "Company limit reached",
      currentCompanies: slots.usedSlots,
      maxCompanies: slots.totalSlots,
      canAddSlots: canAddMore,
      extraSlotPrice: canAddMore ? plan.extraCompanyPrice : null,
      upgradeUrl: "/pricing",
    };
  }

  return {
    allowed: true,
    reason: null,
    currentCompanies: slots.usedSlots,
    maxCompanies: slots.totalSlots,
    canAddSlots:
      subscription.plan.extraCompanyPrice !== null &&
      (subscription.plan.maxCompanies === -1 ||
        slots.totalSlots < subscription.plan.maxCompanies),
    extraSlotPrice: subscription.plan.extraCompanyPrice,
    upgradeUrl: "/pricing",
  };
}

export interface DocumentLimitResult {
  allowed: boolean;
  reason: string | null;
  currentCount: number;
  limit: number;
  unlimited: boolean;
}

/**
 * Check if a company can create more documents
 */
export async function checkDocumentLimit(
  companyId: string
): Promise<DocumentLimitResult> {
  // Find the company owner's subscription
  const ownerMembership = await prisma.companyMembership.findFirst({
    where: { companyId, role: "OWNER" },
    select: { userId: true },
  });

  if (!ownerMembership) {
    // Fallback - no owner found, allow with basic limit
    const currentCount = await prisma.document.count({ where: { companyId } });
    return {
      allowed: currentCount < 3,
      reason: currentCount >= 3 ? "Document limit reached" : null,
      currentCount,
      limit: 3,
      unlimited: false,
    };
  }

  const subscription = await getUserSubscription(ownerMembership.userId);
  const currentCount = await prisma.document.count({ where: { companyId } });

  if (!subscription) {
    // No subscription - basic limit
    return {
      allowed: currentCount < 3,
      reason: currentCount >= 3 ? "Document limit reached" : null,
      currentCount,
      limit: 3,
      unlimited: false,
    };
  }

  const limit = subscription.plan.maxDocumentsPerCompany;

  // Unlimited
  if (limit === null || limit === -1) {
    return {
      allowed: true,
      reason: null,
      currentCount,
      limit: -1,
      unlimited: true,
    };
  }

  return {
    allowed: currentCount < limit,
    reason: currentCount >= limit ? "Document limit reached" : null,
    currentCount,
    limit,
    unlimited: false,
  };
}

/**
 * Get the owner's user ID for a company
 */
export async function getCompanyOwnerId(
  companyId: string
): Promise<string | null> {
  const ownerMembership = await prisma.companyMembership.findFirst({
    where: { companyId, role: "OWNER" },
    select: { userId: true },
  });

  return ownerMembership?.userId ?? null;
}
