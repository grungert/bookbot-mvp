import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { TermsPageComponent } from "./terms-page";
import { getEmailSettings } from "@/lib/settings/emails";
import { generatePageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return generatePageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/terms",
    locale: locale as Locale,
  });
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const emails = await getEmailSettings();

  return <TermsPageComponent legalEmail={emails.legal} />;
}
