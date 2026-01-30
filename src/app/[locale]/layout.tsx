import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ViewTransitions } from "next-view-transitions";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import { CookieConsent } from "@/components/cookie-consent";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <ViewTransitions>
      <SessionProvider>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
          <CookieConsent />
        </NextIntlClientProvider>
      </SessionProvider>
    </ViewTransitions>
  );
}
