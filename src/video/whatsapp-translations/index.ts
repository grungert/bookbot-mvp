import React, { createContext, useContext } from "react";
import { whatsappEn } from "./en";
import { whatsappSr } from "./sr";

export type Locale = "en" | "sr";

// Use a more flexible type for translations to allow different string values
type TranslationValue = string | readonly string[] | Record<string, unknown>;
type TranslationsType = Record<string, TranslationValue | Record<string, TranslationValue>>;

const translations: Record<Locale, TranslationsType> = {
  en: whatsappEn as unknown as TranslationsType,
  sr: whatsappSr as unknown as TranslationsType,
};

export function getWhatsAppTranslations(locale: Locale) {
  return (translations[locale] || translations.en) as typeof whatsappEn;
}

// React Context for translations
const WhatsAppTranslationContext = createContext<typeof whatsappEn>(whatsappEn);

export const WhatsAppTranslationProvider: React.FC<{
  locale: Locale;
  children: React.ReactNode;
}> = ({ locale, children }) => {
  const t = getWhatsAppTranslations(locale);
  return React.createElement(WhatsAppTranslationContext.Provider, { value: t }, children);
};

export function useWhatsAppTranslations() {
  return useContext(WhatsAppTranslationContext);
}

export type WhatsAppTranslations = typeof whatsappEn;
