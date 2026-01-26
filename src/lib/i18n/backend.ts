/**
 * Backend Translation Utility
 *
 * Provides a lightweight getTranslator(locale) function for API routes
 * and backend code that doesn't have access to next-intl's route-based context.
 * Loads from the same messages/en.json and messages/sr.json files.
 */

import enMessages from "../../../messages/en.json";
import srMessages from "../../../messages/sr.json";

type Messages = Record<string, unknown>;

const messagesByLocale: Record<string, Messages> = {
  en: enMessages as Messages,
  sr: srMessages as Messages,
};

/**
 * Resolve a dot-path key from a nested messages object.
 * e.g. "botChat.whatsapp.selectDate" → messages.botChat.whatsapp.selectDate
 */
function resolveKey(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Interpolate {placeholder} values in a string.
 */
function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in values ? String(values[key]) : match;
  });
}

export type TranslatorFn = (key: string, values?: Record<string, string | number>) => string;

/**
 * Create a translator function for the given locale.
 * Falls back to English if key is missing in the requested locale.
 */
export function getTranslator(locale?: string | null): TranslatorFn {
  const lang = locale || "en";
  const messages = messagesByLocale[lang] || messagesByLocale.en;
  const fallback = messagesByLocale.en;

  return (key: string, values?: Record<string, string | number>): string => {
    const resolved = resolveKey(messages, key) ?? resolveKey(fallback, key);
    if (!resolved) return key;
    return interpolate(resolved, values);
  };
}
