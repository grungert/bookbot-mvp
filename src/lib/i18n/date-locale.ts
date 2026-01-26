/**
 * Date-fns Locale Helper
 *
 * Maps company language codes to date-fns locale objects.
 * Used for locale-aware date formatting in tool handlers and chat.
 */

import { enUS, srLatn } from "date-fns/locale";
import type { Locale } from "date-fns";

const localeMap: Record<string, Locale> = {
  en: enUS,
  sr: srLatn,
};

/**
 * Get the date-fns locale for a given language code.
 * Defaults to enUS if not found.
 */
export function getDateLocale(language?: string | null): Locale {
  return localeMap[language || "en"] || enUS;
}
