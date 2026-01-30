import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { UseCasesIndexPage } from "./use-cases-index-page";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "useCases.index" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function UseCasesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UseCasesIndexPage />;
}
