import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { WhatsAppFeaturePage } from "./whatsapp-feature-page";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features.whatsapp" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function WhatsAppPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WhatsAppFeaturePage />;
}
