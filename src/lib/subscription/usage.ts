import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "./limits";
import { SubscriptionStatus } from "@prisma/client";

/**
 * Get the current billing period boundaries (monthly)
 */
export function getCurrentPeriodBoundaries(): {
  periodStart: Date;
  periodEnd: Date;
} {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return { periodStart, periodEnd };
}

export interface ChatLimitResult {
  allowed: boolean;
  reason: string | null;
  currentUsage: number;
  limit: number;
  bonusTokens: number;
  effectiveLimit: number;
  unlimited: boolean;
  resetsAt: Date;
  remainingTokens: number;
}

/**
 * Check if user is under their monthly chat limit
 * Note: Chat limit is at USER level, shared across all companies
 * @param estimatedTokens - Optional estimate of tokens for this request to check hard limit (#3)
 */
export async function checkChatLimit(userId: string, estimatedTokens: number = 0): Promise<ChatLimitResult> {
  const subscription = await getUserSubscription(userId);
  const { periodStart, periodEnd } = getCurrentPeriodBoundaries();

  // Get current usage
  const usage = await prisma.chatUsage.findUnique({
    where: {
      userId_periodStart: {
        userId,
        periodStart,
      },
    },
  });

  const currentUsage = usage?.tokenCount ?? 0;

  if (!subscription) {
    // No subscription - use default token limit
    const defaultLimit = 50000;
    const remaining = Math.max(0, defaultLimit - currentUsage);
    // Hard limit check: reject if estimated usage would exceed limit (#3)
    const wouldExceed = estimatedTokens > 0 && (currentUsage + estimatedTokens) > defaultLimit;
    return {
      allowed: currentUsage < defaultLimit && !wouldExceed,
      reason: currentUsage >= defaultLimit || wouldExceed ? "Monthly token limit reached" : null,
      currentUsage,
      limit: defaultLimit,
      bonusTokens: 0,
      effectiveLimit: defaultLimit,
      unlimited: false,
      resetsAt: periodEnd,
      remainingTokens: remaining,
    };
  }

  // Check subscription status
  const activeStatuses: SubscriptionStatus[] = ["TRIALING", "ACTIVE"];
  if (!activeStatuses.includes(subscription.status)) {
    const effectiveLimitValue = subscription.plan.maxChatTokensPerMonth + subscription.bonusTokenBalance;
    return {
      allowed: false,
      reason:
        subscription.status === "TRIAL_EXPIRED"
          ? "Trial period has ended"
          : "Subscription not active",
      currentUsage,
      limit: subscription.plan.maxChatTokensPerMonth,
      bonusTokens: subscription.bonusTokenBalance,
      effectiveLimit: effectiveLimitValue,
      unlimited: false,
      resetsAt: periodEnd,
      remainingTokens: Math.max(0, effectiveLimitValue - currentUsage),
    };
  }

  const limit = subscription.plan.maxChatTokensPerMonth;
  const bonusTokens = subscription.bonusTokenBalance;

  // Unlimited check (-1 means unlimited)
  if (limit === -1) {
    return {
      allowed: true,
      reason: null,
      currentUsage,
      limit: -1,
      bonusTokens,
      effectiveLimit: -1,
      unlimited: true,
      resetsAt: periodEnd,
      remainingTokens: -1, // Unlimited
    };
  }

  const effectiveLimit = limit + bonusTokens;
  const remaining = Math.max(0, effectiveLimit - currentUsage);
  // Hard limit check: reject if estimated usage would exceed limit (#3)
  const wouldExceed = estimatedTokens > 0 && (currentUsage + estimatedTokens) > effectiveLimit;

  return {
    allowed: currentUsage < effectiveLimit && !wouldExceed,
    reason:
      currentUsage >= effectiveLimit || wouldExceed
        ? "Monthly token limit reached across all companies"
        : null,
    currentUsage,
    limit,
    bonusTokens,
    effectiveLimit,
    unlimited: false,
    resetsAt: periodEnd,
    remainingTokens: remaining,
  };
}

/**
 * Increment chat usage for a user
 * Uses atomic upsert to handle concurrent requests
 * When planLimit is provided, deducts from bonusTokenBalance once plan limit is exceeded
 * Wrapped in transaction to prevent race conditions (#18)
 */
export async function incrementChatUsage(
  userId: string,
  count: number = 1,
  tokenData?: { inputTokens: number; outputTokens: number; totalTokens: number },
  planLimit?: number
): Promise<number> {
  const { periodStart, periodEnd } = getCurrentPeriodBoundaries();

  // Wrap in transaction for atomicity (#18)
  const result = await prisma.$transaction(async (tx) => {
    const usageResult = await tx.chatUsage.upsert({
      where: {
        userId_periodStart: {
          userId,
          periodStart,
        },
      },
      update: {
        messageCount: {
          increment: count,
        },
        tokenCount: {
          increment: tokenData?.totalTokens ?? 0,
        },
      },
      create: {
        userId,
        periodStart,
        periodEnd,
        messageCount: count,
        tokenCount: tokenData?.totalTokens ?? 0,
      },
    });

    // Deduct bonus tokens if plan limit is exceeded (within same transaction)
    if (planLimit !== undefined && planLimit > 0 && tokenData?.totalTokens) {
      const tokensJustUsed = tokenData.totalTokens;
      const newTokenCount = usageResult.tokenCount;
      const previousOverage = Math.max(0, (newTokenCount - tokensJustUsed) - planLimit);
      const currentOverage = Math.max(0, newTokenCount - planLimit);
      const bonusConsumed = currentOverage - previousOverage;

      if (bonusConsumed > 0) {
        await tx.$executeRaw`
          UPDATE "UserSubscription"
          SET "bonusTokenBalance" = GREATEST(0, "bonusTokenBalance" - ${bonusConsumed})
          WHERE "userId" = ${userId}
        `;
      }
    }

    return usageResult;
  });

  return result.tokenCount;
}

/**
 * Get usage statistics for a user
 */
export async function getChatUsageStats(userId: string): Promise<{
  currentPeriod: {
    start: Date;
    end: Date;
    used: number;
    limit: number;
    bonusTokenBalance: number;
    effectiveLimit: number;
    unlimited: boolean;
    percentUsed: number;
  };
  history: Array<{
    periodStart: Date;
    periodEnd: Date;
    messageCount: number;
  }>;
}> {
  const subscription = await getUserSubscription(userId);
  const { periodStart, periodEnd } = getCurrentPeriodBoundaries();

  const [currentUsage, history] = await Promise.all([
    prisma.chatUsage.findUnique({
      where: {
        userId_periodStart: {
          userId,
          periodStart,
        },
      },
    }),
    prisma.chatUsage.findMany({
      where: { userId },
      orderBy: { periodStart: "desc" },
      take: 6, // Last 6 months
    }),
  ]);

  const limit = subscription?.plan.maxChatTokensPerMonth ?? 50000;
  const bonusTokenBalance = subscription?.bonusTokenBalance ?? 0;
  const unlimited = limit === -1;
  const effectiveLimit = unlimited ? -1 : limit + bonusTokenBalance;
  const used = currentUsage?.tokenCount ?? 0;

  return {
    currentPeriod: {
      start: periodStart,
      end: periodEnd,
      used,
      limit,
      bonusTokenBalance,
      effectiveLimit,
      unlimited,
      percentUsed: unlimited ? 0 : Math.round((used / effectiveLimit) * 100),
    },
    history: history.map((h) => ({
      periodStart: h.periodStart,
      periodEnd: h.periodEnd,
      messageCount: h.messageCount,
    })),
  };
}
