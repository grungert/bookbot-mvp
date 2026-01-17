/**
 * Client-side URL validation utilities to prevent open redirect vulnerabilities
 */

/**
 * Validates that a callback URL is safe to redirect to.
 * Only allows relative URLs (paths starting with /).
 */
export function isValidCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Only allow relative URLs (starting with /) but not protocol-relative URLs (//)
  if (url.startsWith("/") && !url.startsWith("//")) {
    // Additional check: ensure no protocol injection via encoded characters
    const decoded = decodeURIComponent(url);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return true;
    }
  }

  return false;
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
