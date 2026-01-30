import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { SalonsUseCasePage } from "./salons-use-case-page";
import { generatePageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "useCases.salons" });

  return generatePageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/use-cases/salons",
    locale: locale as Locale,
  });
}

export default async function SalonsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SalonsUseCasePage />;
}
