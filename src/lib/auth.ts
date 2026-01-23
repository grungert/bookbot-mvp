import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthOptions, type DefaultSession, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole, MembershipRole } from "@prisma/client";
import { z } from "zod";
import { defaultLocale } from "@/i18n/config";
import {
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
} from "@/lib/account-lockout";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";

// Re-export for backward compatibility
export { AUTH_ERROR_CODES } from "@/lib/auth-errors";
export type { AuthErrorCode } from "@/lib/auth-errors";

// Membership info for session
export interface SessionMembership {
  companyId: string;
  companySlug: string;
  companyName: string;
  role: MembershipRole;
  isPrimary: boolean;
}

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      companyId: string | null;
      memberships: SessionMembership[];
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    companyId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    companyId: string | null;
    memberships: SessionMembership[];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: `/${defaultLocale}/login`,
    error: `/${defaultLocale}/login`,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if account is locked
        const lockoutStatus = await checkAccountLockout(user.id);
        if (lockoutStatus.isLocked) {
          // Throw an error that includes the lockout info
          // The error message format allows the client to parse and display appropriately
          throw new Error(
            `${AUTH_ERROR_CODES.ACCOUNT_LOCKED}:${lockoutStatus.lockedUntil?.toISOString()}`
          );
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          // Record failed login attempt
          const newLockoutStatus = await recordFailedLogin(user.id);

          if (newLockoutStatus.isLocked) {
            throw new Error(
              `${AUTH_ERROR_CODES.ACCOUNT_LOCKED}:${newLockoutStatus.lockedUntil?.toISOString()}`
            );
          }

          return null;
        }

        // Check if email is verified (strict mode - block login)
        if (!user.emailVerified) {
          throw new Error(AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED);
        }

        // Reset failed login attempts on successful login
        await resetFailedLogins(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null, // Don't include base64 images in auth - fetch via API instead
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;

        // Remove any base64 images from the token to prevent oversized cookies
        // The user's profile picture should be fetched via API instead
        delete token.picture;
        if (typeof token.image === 'string' && token.image.startsWith('data:')) {
          delete token.image;
        }

        // For OAuth users, fetch role and companyId from database
        let userRole = user.role;
        let userCompanyId = user.companyId;

        if (!userRole) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, companyId: true },
          });
          if (dbUser) {
            userRole = dbUser.role;
            userCompanyId = dbUser.companyId;
          } else {
            // Fallback for new OAuth users
            userRole = UserRole.END_USER;
            userCompanyId = null;
          }
        }

        token.role = userRole ?? UserRole.END_USER;
        token.companyId = userCompanyId ?? null;

        // Fetch memberships for COMPANY_ADMIN users
        if (userRole === UserRole.COMPANY_ADMIN) {
          const memberships = await prisma.companyMembership.findMany({
            where: { userId: user.id },
            include: {
              company: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
            orderBy: [
              { isPrimary: "desc" },
              { createdAt: "asc" },
            ],
          });

          token.memberships = memberships.map((m) => ({
            companyId: m.company.id,
            companySlug: m.company.slug,
            companyName: m.company.name,
            role: m.role,
            isPrimary: m.isPrimary,
          }));
        } else {
          token.memberships = [];
        }
      }

      // Refresh memberships on session update
      if (trigger === "update" && token.role === UserRole.COMPANY_ADMIN) {
        const memberships = await prisma.companyMembership.findMany({
          where: { userId: token.id },
          include: {
            company: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "asc" },
          ],
        });

        token.memberships = memberships.map((m) => ({
          companyId: m.company.id,
          companySlug: m.company.slug,
          companyName: m.company.name,
          role: m.role,
          isPrimary: m.isPrimary,
        }));
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.memberships = token.memberships || [];
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google OAuth, ensure user.id is set correctly for JWT callback
      // The adapter handles account linking via allowDangerousEmailAccountLinking
      if (account?.provider === "google" && user.email) {
        const normalizedEmail = user.email.toLowerCase();
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (dbUser) {
          // Ensure JWT callback gets the correct user ID
          user.id = dbUser.id;
        }
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Export auth function compatible with App Router
export async function auth() {
  return getServerSession(authOptions);
}

// Export handlers for route handler
export const handlers = {
  GET: handler,
  POST: handler,
};

// Helper to get current session on server
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

// Helper to check if user has specific role
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(userRole);
}

// Hash password helper
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Allowed hosts for callback URLs (add your domains here)
const ALLOWED_CALLBACK_HOSTS: string[] = [
  // Add production domains here if needed
];

/**
 * Validates that a callback URL is safe to redirect to.
 * Only allows relative URLs or URLs from allowed hosts.
 */
export function isValidCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Allow relative URLs (starting with /)
  if (url.startsWith("/") && !url.startsWith("//")) {
    return true;
  }

  // Check if it's an absolute URL from an allowed host
  try {
    const parsedUrl = new URL(url);
    // Only allow http/https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }
    // Check against allowed hosts
    return ALLOWED_CALLBACK_HOSTS.includes(parsedUrl.host);
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Returns a safe callback URL, falling back to the provided fallback if the URL is invalid.
 */
export function getSafeCallbackUrl(
  url: string | null | undefined,
  fallback: string = "/"
): string {
  if (isValidCallbackUrl(url)) {
    return url as string;
  }
  return fallback;
}
