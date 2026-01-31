import React, { createContext, useContext } from "react";
import { en, type Translations } from "./en";
import { sr } from "./sr";

export type Locale = "en" | "sr";

const translations: Record<Locale, Translations> = {
  en,
  sr,
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.en;
}

// React Context for translations
const TranslationContext = createContext<Translations>(en);

export const TranslationProvider: React.FC<{
  locale: Locale;
  children: React.ReactNode;
}> = ({ locale, children }) => {
  const t = getTranslations(locale);
  return React.createElement(TranslationContext.Provider, { value: t }, children);
};

export function useTranslations(): Translations {
  return useContext(TranslationContext);
}

export type { Translations };
