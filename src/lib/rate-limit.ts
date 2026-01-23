/**
 * In-memory rate limiting for authentication endpoints
 *
 * Rate limits:
 * - Login: 5 attempts per 15 minutes per IP+email combination
 * - Registration: 3 attempts per hour per IP
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

// In-memory stores (reset on server restart)
const loginAttempts = new Map<string, RateLimitEntry>();
const registrationAttempts = new Map<string, RateLimitEntry>();

// Configuration
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const REGISTRATION_LIMIT = 3;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Cleanup interval (run every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Clean up expired entries from the rate limit stores
 */
function cleanupExpiredEntries() {
  const now = Date.now();

  for (const [key, entry] of loginAttempts.entries()) {
    if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }

  for (const [key, entry] of registrationAttempts.entries()) {
    if (now - entry.firstAttempt > REGISTRATION_WINDOW_MS) {
      registrationAttempts.delete(key);
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
}

/**
 * Create a rate limit key for login attempts
 */
function createLoginKey(email: string, ipAddress: string): string {
  return `login:${email.toLowerCase()}:${ipAddress}`;
}

/**
 * Create a rate limit key for registration attempts
 */
function createRegistrationKey(ipAddress: string): string {
  return `register:${ipAddress}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

/**
 * Check and increment login rate limit
 * Returns whether the request is allowed
 */
export function checkLoginRateLimit(
  email: string,
  ipAddress: string
): RateLimitResult {
  const key = createLoginKey(email, ipAddress);
  const now = Date.now();
  const entry = loginAttempts.get(key);

  // No previous attempts or window expired
  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: LOGIN_LIMIT - 1,
      resetAt: new Date(now + LOGIN_WINDOW_MS),
      retryAfterSeconds: 0,
    };
  }

  // Within window - check if limit exceeded
  const resetAt = new Date(entry.firstAttempt + LOGIN_WINDOW_MS);
  const retryAfterSeconds = Math.ceil((resetAt.getTime() - now) / 1000);

  if (entry.count >= LOGIN_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  // Increment counter
  entry.count++;
  loginAttempts.set(key, entry);

  return {
    allowed: true,
    remaining: LOGIN_LIMIT - entry.count,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Check and increment registration rate limit
 * Returns whether the request is allowed
 */
export function checkRegistrationRateLimit(
  ipAddress: string
): RateLimitResult {
  const key = createRegistrationKey(ipAddress);
  const now = Date.now();
  const entry = registrationAttempts.get(key);

  // No previous attempts or window expired
  if (!entry || now - entry.firstAttempt > REGISTRATION_WINDOW_MS) {
    registrationAttempts.set(key, { count: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: REGISTRATION_LIMIT - 1,
      resetAt: new Date(now + REGISTRATION_WINDOW_MS),
      retryAfterSeconds: 0,
    };
  }

  // Within window - check if limit exceeded
  const resetAt = new Date(entry.firstAttempt + REGISTRATION_WINDOW_MS);
  const retryAfterSeconds = Math.ceil((resetAt.getTime() - now) / 1000);

  if (entry.count >= REGISTRATION_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  // Increment counter
  entry.count++;
  registrationAttempts.set(key, entry);

  return {
    allowed: true,
    remaining: REGISTRATION_LIMIT - entry.count,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset login rate limit for a specific email+IP (e.g., after successful login)
 */
export function resetLoginRateLimit(email: string, ipAddress: string): void {
  const key = createLoginKey(email, ipAddress);
  loginAttempts.delete(key);
}

/**
 * Get the current login attempt count (for testing/debugging)
 */
export function getLoginAttemptCount(
  email: string,
  ipAddress: string
): number {
  const key = createLoginKey(email, ipAddress);
  const entry = loginAttempts.get(key);
  return entry?.count ?? 0;
}

/**
 * Get the current registration attempt count (for testing/debugging)
 */
export function getRegistrationAttemptCount(ipAddress: string): number {
  const key = createRegistrationKey(ipAddress);
  const entry = registrationAttempts.get(key);
  return entry?.count ?? 0;
}
