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
  unlimited: boolean;
  resetsAt: Date;
}

/**
 * Check if user is under their monthly chat limit
 * Note: Chat limit is at USER level, shared across all companies
 */
export async function checkChatLimit(userId: string): Promise<ChatLimitResult> {
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
    return {
      allowed: currentUsage < 50000,
      reason: currentUsage >= 50000 ? "Monthly token limit reached" : null,
      currentUsage,
      limit: 50000,
      unlimited: false,
      resetsAt: periodEnd,
    };
  }

  // Check subscription status
  const activeStatuses: SubscriptionStatus[] = ["TRIALING", "ACTIVE"];
  if (!activeStatuses.includes(subscription.status)) {
    return {
      allowed: false,
      reason:
        subscription.status === "TRIAL_EXPIRED"
          ? "Trial period has ended"
          : "Subscription not active",
      currentUsage,
      limit: subscription.plan.maxChatTokensPerMonth,
      unlimited: false,
      resetsAt: periodEnd,
    };
  }

  const limit = subscription.plan.maxChatTokensPerMonth;

  // Unlimited check (-1 means unlimited)
  if (limit === -1) {
    return {
      allowed: true,
      reason: null,
      currentUsage,
      limit: -1,
      unlimited: true,
      resetsAt: periodEnd,
    };
  }

  return {
    allowed: currentUsage < limit,
    reason:
      currentUsage >= limit
        ? "Monthly token limit reached across all companies"
        : null,
    currentUsage,
    limit,
    unlimited: false,
    resetsAt: periodEnd,
  };
}

/**
 * Increment chat usage for a user
 * Uses atomic upsert to handle concurrent requests
 */
export async function incrementChatUsage(
  userId: string,
  count: number = 1,
  tokenData?: { inputTokens: number; outputTokens: number; totalTokens: number }
): Promise<number> {
  const { periodStart, periodEnd } = getCurrentPeriodBoundaries();

  const result = await prisma.chatUsage.upsert({
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
  const unlimited = limit === -1;
  const used = currentUsage?.tokenCount ?? 0;

  return {
    currentPeriod: {
      start: periodStart,
      end: periodEnd,
      used,
      limit,
      unlimited,
      percentUsed: unlimited ? 0 : Math.round((used / limit) * 100),
    },
    history: history.map((h) => ({
      periodStart: h.periodStart,
      periodEnd: h.periodEnd,
      messageCount: h.messageCount,
    })),
  };
}
