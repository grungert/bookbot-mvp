/**
 * Account lockout functionality
 *
 * Configuration:
 * - 5 failed login attempts triggers account lockout
 * - 30 minute lockout duration
 * - Failed attempt counter resets after successful login or lockout expiry
 */

import { prisma } from "@/lib/prisma";

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface LockoutStatus {
  isLocked: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  remainingAttempts: number;
}

/**
 * Check if a user account is currently locked
 */
export async function checkAccountLockout(
  userId: string
): Promise<LockoutStatus> {
  const lockout = await prisma.accountLockout.findUnique({
    where: { userId },
  });

  if (!lockout) {
    return {
      isLocked: false,
      failedAttempts: 0,
      lockedUntil: null,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  const now = new Date();

  // Check if lockout has expired
  if (lockout.lockedUntil && lockout.lockedUntil > now) {
    return {
      isLocked: true,
      failedAttempts: lockout.failedAttempts,
      lockedUntil: lockout.lockedUntil,
      remainingAttempts: 0,
    };
  }

  // Lockout expired - reset the counter
  if (lockout.lockedUntil && lockout.lockedUntil <= now) {
    await prisma.accountLockout.update({
      where: { userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastFailedAt: null,
      },
    });

    return {
      isLocked: false,
      failedAttempts: 0,
      lockedUntil: null,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  return {
    isLocked: false,
    failedAttempts: lockout.failedAttempts,
    lockedUntil: null,
    remainingAttempts: MAX_FAILED_ATTEMPTS - lockout.failedAttempts,
  };
}

/**
 * Record a failed login attempt and potentially lock the account
 */
export async function recordFailedLogin(userId: string): Promise<LockoutStatus> {
  const now = new Date();

  const lockout = await prisma.accountLockout.upsert({
    where: { userId },
    create: {
      userId,
      failedAttempts: 1,
      lastFailedAt: now,
    },
    update: {
      failedAttempts: { increment: 1 },
      lastFailedAt: now,
    },
  });

  // Check if we should lock the account
  if (lockout.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);

    await prisma.accountLockout.update({
      where: { userId },
      data: { lockedUntil },
    });

    return {
      isLocked: true,
      failedAttempts: lockout.failedAttempts,
      lockedUntil,
      remainingAttempts: 0,
    };
  }

  return {
    isLocked: false,
    failedAttempts: lockout.failedAttempts,
    lockedUntil: null,
    remainingAttempts: MAX_FAILED_ATTEMPTS - lockout.failedAttempts,
  };
}

/**
 * Reset failed login attempts after successful login
 */
export async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.accountLockout.upsert({
    where: { userId },
    create: {
      userId,
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
    },
    update: {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
    },
  });
}

/**
 * Get the time remaining until lockout expires (in seconds)
 */
export function getLockoutRemainingSeconds(lockedUntil: Date): number {
  const now = new Date();
  const remaining = lockedUntil.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Format remaining lockout time for display
 */
export function formatLockoutTime(lockedUntil: Date): string {
  const seconds = getLockoutRemainingSeconds(lockedUntil);

  if (seconds <= 0) return "0 seconds";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}${remainingSeconds > 0 ? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}` : ""}`;
  }

  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}
