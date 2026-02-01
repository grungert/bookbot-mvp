import React, { createContext, useContext } from "react";
import { mobileEn } from "./en";
import { mobileSr } from "./sr";

export type Locale = "en" | "sr";

// Use a more flexible type for translations to allow different string values
type TranslationValue = string | readonly string[] | Record<string, unknown>;
type TranslationsType = Record<string, TranslationValue | Record<string, TranslationValue>>;

const translations: Record<Locale, TranslationsType> = {
  en: mobileEn as unknown as TranslationsType,
  sr: mobileSr as unknown as TranslationsType,
};

export function getMobileTranslations(locale: Locale) {
  return (translations[locale] || translations.en) as typeof mobileEn;
}

// React Context for translations
const MobileTranslationContext = createContext<typeof mobileEn>(mobileEn);

export const MobileTranslationProvider: React.FC<{
  locale: Locale;
  children: React.ReactNode;
}> = ({ locale, children }) => {
  const t = getMobileTranslations(locale);
  return React.createElement(MobileTranslationContext.Provider, { value: t }, children);
};

export function useMobileTranslations() {
  return useContext(MobileTranslationContext);
}

export type MobileTranslations = typeof mobileEn;
