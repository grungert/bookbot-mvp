import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ConsultantsUseCasePage } from "./consultants-use-case-page";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "useCases.consultants" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ConsultantsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ConsultantsUseCasePage />;
}
