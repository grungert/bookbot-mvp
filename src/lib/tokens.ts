/**
 * Secure token generation and validation for password reset and email verification
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Token expiry times
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(), // Mark as used to invalidate
    },
  });

  // Create new token
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate and consume a password reset token
 * Returns userId if valid, null otherwise
 */
export async function validatePasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return null;
  }

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    return null;
  }

  // Check if token is already used
  if (resetToken.usedAt) {
    return null;
  }

  return { userId: resetToken.userId };
}

/**
 * Mark a password reset token as used
 */
export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}

/**
 * Create an email verification token for a user
 */
export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

  // Invalidate any existing unused tokens for this user
  await prisma.emailVerificationToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(), // Mark as used to invalidate
    },
  });

  // Create new token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate an email verification token (does not consume it)
 * Returns userId if valid, null otherwise
 */
export async function validateEmailVerificationToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return null;
  }

  // Check if token is expired
  if (verificationToken.expiresAt < new Date()) {
    return null;
  }

  // Check if token is already used
  if (verificationToken.usedAt) {
    return null;
  }

  return {
    userId: verificationToken.userId,
    email: verificationToken.user.email,
  };
}

/**
 * Consume email verification token and mark user's email as verified
 */
export async function consumeEmailVerificationToken(
  token: string
): Promise<{ success: boolean; userId?: string }> {
  const validation = await validateEmailVerificationToken(token);

  if (!validation) {
    return { success: false };
  }

  // Mark token as used and verify email in a transaction
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: validation.userId },
      data: { emailVerified: new Date() },
    }),
  ]);

  return { success: true, userId: validation.userId };
}

/**
 * Check if a user has a pending (valid, unused) email verification token
 */
export async function hasPendingEmailVerification(
  userId: string
): Promise<boolean> {
  const token = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return !!token;
}

/**
 * Clean up expired tokens (can be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();

  await Promise.all([
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
      },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
      },
    }),
  ]);
}
