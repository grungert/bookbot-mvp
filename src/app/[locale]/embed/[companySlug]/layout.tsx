import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { setRequestLocale } from "next-intl/server";
import { generateThemePalette } from "@/lib/utils/colors";

interface EmbedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function EmbedLayout({
  children,
  params,
}: EmbedLayoutProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  // Generate theme palette from company's primary color
  const palette = generateThemePalette(company.primaryColor);

  return (
    <div
      className="min-h-screen"
      data-theme-wrapper
      style={
        {
          "--company-primary": company.primaryColor,
          "--primary": palette.primary,
          "--primary-foreground": palette.foreground,
          "--ring": palette.ring,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
