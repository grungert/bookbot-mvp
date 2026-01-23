import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

// Routes that require authentication
const protectedRoutes = ["/admin", "/super-admin", "/user"];

// Extract locale from pathname
function getLocaleFromPath(pathname: string): string | null {
  const locales = ["en", "sr"];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return segments[0];
  }
  return null;
}

// Check if path matches protected routes (after removing locale prefix)
function isProtectedRoute(pathname: string): boolean {
  const locales = ["en", "sr"];
  let pathWithoutLocale = pathname;

  // Remove locale prefix if present
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      pathWithoutLocale = pathname.substring(locale.length + 1);
      break;
    } else if (pathname === `/${locale}`) {
      pathWithoutLocale = "/";
      break;
    }
  }

  // Check if the path (without locale) starts with any protected route
  return protectedRoutes.some(
    (route) =>
      pathWithoutLocale.startsWith(route) ||
      pathWithoutLocale.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for API routes, static files, and auth pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".") ||
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/verify-email")
  ) {
    return handleI18nRouting(request);
  }

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If not authenticated, redirect to login
    if (!token) {
      const locale = getLocaleFromPath(pathname) || "en";
      const callbackUrl = encodeURIComponent(pathname);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Continue with i18n routing
  return handleI18nRouting(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/"],
};
