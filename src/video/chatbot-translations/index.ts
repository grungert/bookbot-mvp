import React, { createContext, useContext } from "react";
import { chatbotEn, type ChatbotTranslations } from "./en";
import { chatbotSr } from "./sr";

export type Locale = "en" | "sr";

const translations: Record<Locale, ChatbotTranslations> = {
  en: chatbotEn,
  sr: chatbotSr,
};

export function getChatbotTranslations(locale: Locale): ChatbotTranslations {
  return translations[locale] || translations.en;
}

// React Context for translations
const ChatbotTranslationContext = createContext<ChatbotTranslations>(chatbotEn);

export const ChatbotTranslationProvider: React.FC<{
  locale: Locale;
  children: React.ReactNode;
}> = ({ locale, children }) => {
  const t = getChatbotTranslations(locale);
  return React.createElement(ChatbotTranslationContext.Provider, { value: t }, children);
};

export function useChatbotTranslations(): ChatbotTranslations {
  return useContext(ChatbotTranslationContext);
}

export type { ChatbotTranslations };
