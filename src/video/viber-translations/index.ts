import React, { createContext, useContext } from "react";
import { viberEn } from "./en";
import { viberSr } from "./sr";

export type Locale = "en" | "sr";

// Use a more flexible type for translations to allow different string values
type TranslationValue = string | readonly string[] | Record<string, unknown>;
type TranslationsType = Record<string, TranslationValue | Record<string, TranslationValue>>;

const translations: Record<Locale, TranslationsType> = {
  en: viberEn as unknown as TranslationsType,
  sr: viberSr as unknown as TranslationsType,
};

export function getViberTranslations(locale: Locale) {
  return (translations[locale] || translations.en) as typeof viberEn;
}

// React Context for translations
const ViberTranslationContext = createContext<typeof viberEn>(viberEn);

export const ViberTranslationProvider: React.FC<{
  locale: Locale;
  children: React.ReactNode;
}> = ({ locale, children }) => {
  const t = getViberTranslations(locale);
  return React.createElement(ViberTranslationContext.Provider, { value: t }, children);
};

export function useViberTranslations() {
  return useContext(ViberTranslationContext);
}

export type ViberTranslations = typeof viberEn;
