/**
 * AES-256-GCM Encryption Utility
 *
 * Used for encrypting sensitive credentials like WhatsApp API tokens.
 * Requires ENCRYPTION_KEY environment variable (32-byte key, 64 hex characters).
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variable
 * Returns null if not configured (for graceful degradation)
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    return null;
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    console.warn(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${key.length} characters.`
    );
    return null;
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * Format: base64(iv + authTag + ciphertext)
 * Throws if ENCRYPTION_KEY is not configured
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate a 32-byte key with: openssl rand -hex 32"
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + ciphertext
  const combined = Buffer.concat([iv, authTag, ciphertext]);

  return combined.toString("base64");
}

/**
 * Decrypt a value encrypted with encrypt()
 * Returns null if ENCRYPTION_KEY is not configured
 */
export function decrypt(encrypted: string): string | null {
  const key = getEncryptionKey();
  if (!key) {
    console.warn("Cannot decrypt: ENCRYPTION_KEY is not configured");
    return null;
  }

  const combined = Buffer.from(encrypted, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/**
 * Check if a value is encrypted (starts with valid base64 and has correct length)
 */
export function isEncrypted(value: string): boolean {
  try {
    const decoded = Buffer.from(value, "base64");
    // Minimum length: IV (16) + authTag (16) + at least 1 byte of ciphertext
    return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Safely decrypt a value, returning null if decryption fails
 */
export function safeDecrypt(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;

  try {
    return decrypt(encrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

/**
 * Mask a sensitive value for display (show last 4 characters)
 */
export function maskValue(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return "****";
  return `****${value.slice(-4)}`;
}

/**
 * Generate a new encryption key (for setup purposes)
 * Run: npx ts-node -e "import { generateKey } from './src/lib/encryption'; console.log(generateKey())"
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
