import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "./limits";
import { SubscriptionStatus, PlanTier } from "@prisma/client";

export interface TrialStatus {
  isTrialing: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
  status: SubscriptionStatus | null;
  planTier: PlanTier | null;
}

/**
 * Get trial status for a user
 */
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      isTrialing: false,
      isExpired: false,
      daysRemaining: 0,
      trialEndsAt: null,
      status: null,
      planTier: null,
    };
  }

  const now = new Date();
  const { trialEndsAt, status, plan } = subscription;

  // Not in trial
  if (status !== "TRIALING" && status !== "TRIAL_EXPIRED") {
    return {
      isTrialing: false,
      isExpired: false,
      daysRemaining: 0,
      trialEndsAt,
      status,
      planTier: plan.tier,
    };
  }

  // Check if trial is expired
  if (trialEndsAt && trialEndsAt < now) {
    // Use atomic update to prevent race conditions (#27)
    // Only update if status is still TRIALING (not already expired by another process)
    if (status !== "TRIAL_EXPIRED") {
      await prisma.userSubscription.updateMany({
        where: {
          id: subscription.id,
          status: "TRIALING", // Only update if still TRIALING
        },
        data: { status: "TRIAL_EXPIRED" },
      });
    }

    return {
      isTrialing: false,
      isExpired: true,
      daysRemaining: 0,
      trialEndsAt,
      status: "TRIAL_EXPIRED",
      planTier: plan.tier,
    };
  }

  // Trial is active
  const daysRemaining = trialEndsAt
    ? Math.max(
        0,
        Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return {
    isTrialing: true,
    isExpired: false,
    daysRemaining,
    trialEndsAt,
    status,
    planTier: plan.tier,
  };
}

/**
 * Check if user's trial has expired
 */
export async function isTrialExpired(userId: string): Promise<boolean> {
  const status = await getTrialStatus(userId);
  return status.isExpired;
}

/**
 * Check if user has an active subscription (trial or paid)
 */
export async function checkSubscriptionActive(userId: string): Promise<{
  active: boolean;
  status: SubscriptionStatus | null;
  reason: string | null;
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      active: false,
      status: null,
      reason: "No subscription found",
    };
  }

  const { status, trialEndsAt } = subscription;
  const now = new Date();

  switch (status) {
    case "ACTIVE":
      return { active: true, status, reason: null };

    case "TRIALING":
      // Check if trial has expired
      if (trialEndsAt && trialEndsAt < now) {
        // Use atomic update to prevent race conditions (#27)
        await prisma.userSubscription.updateMany({
          where: {
            id: subscription.id,
            status: "TRIALING", // Only update if still TRIALING
          },
          data: { status: "TRIAL_EXPIRED" },
        });
        return {
          active: false,
          status: "TRIAL_EXPIRED",
          reason: "Trial period has ended",
        };
      }
      return { active: true, status, reason: null };

    case "TRIAL_EXPIRED":
      return {
        active: false,
        status,
        reason: "Trial period has ended",
      };

    case "PAST_DUE":
      return {
        active: false,
        status,
        reason: "Payment overdue",
      };

    case "CANCELLED":
      return {
        active: false,
        status,
        reason: "Subscription cancelled",
      };

    default:
      return {
        active: false,
        status,
        reason: "Invalid subscription status",
      };
  }
}

/**
 * Get days remaining in trial
 */
export async function getDaysRemaining(userId: string): Promise<number> {
  const status = await getTrialStatus(userId);
  return status.daysRemaining;
}

/**
 * Create a trial subscription for a new user
 */
export async function createTrialSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user already has a subscription
  const existing = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  if (existing) {
    return { success: false, error: "User already has a subscription" };
  }

  // Get the trial plan
  const trialPlan = await prisma.plan.findUnique({
    where: { tier: "TRIAL" },
  });

  if (!trialPlan) {
    return { success: false, error: "Trial plan not found" };
  }

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + (trialPlan.trialDays ?? 14) * 24 * 60 * 60 * 1000
  );
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  await prisma.userSubscription.create({
    data: {
      userId,
      planId: trialPlan.id,
      status: "TRIALING",
      trialEndsAt,
      currentPeriodStart: now, // Explicitly set to avoid timezone issues (#17)
      currentPeriodEnd: periodEnd,
    },
  });

  return { success: true };
}

/**
 * Upgrade a user's subscription to a new plan
 */
export async function upgradeSubscription(
  userId: string,
  planTier: PlanTier
): Promise<{ success: boolean; error?: string }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { success: false, error: "No subscription found" };
  }

  const newPlan = await prisma.plan.findUnique({
    where: { tier: planTier },
  });

  if (!newPlan) {
    return { success: false, error: "Plan not found" };
  }

  const now = new Date();
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      planId: newPlan.id,
      status: "ACTIVE",
      trialEndsAt: null, // Clear trial
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  return { success: true };
}

/**
 * Add extra company slots to a subscription
 */
export async function addCompanySlots(
  userId: string,
  slotsToAdd: number
): Promise<{ success: boolean; error?: string; newTotal?: number }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { success: false, error: "No subscription found" };
  }

  if (subscription.plan.extraCompanyPrice === null) {
    return { success: false, error: "Plan does not support extra company slots" };
  }

  // Check max companies limit
  const newTotal = subscription.extraCompanySlots + slotsToAdd;
  if (
    subscription.plan.maxCompanies !== -1 &&
    subscription.plan.baseCompanies + newTotal > subscription.plan.maxCompanies
  ) {
    return {
      success: false,
      error: `Maximum ${subscription.plan.maxCompanies} companies allowed`,
    };
  }

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      extraCompanySlots: newTotal,
    },
  });

  return {
    success: true,
    newTotal: subscription.plan.baseCompanies + newTotal,
  };
}
