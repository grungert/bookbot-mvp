import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/navigation/header";
import { generateThemePalette } from "@/lib/utils/colors";

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function CompanyLayout({
  children,
  params,
}: CompanyLayoutProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  // Check if user can access admin
  const user = await getCurrentUser();
  const canAccessAdmin =
    user?.role === "SUPER_ADMIN" ||
    (user?.role === "COMPANY_ADMIN" && user.companyId === company.id);

  // Generate theme palette from company's primary color
  const palette = generateThemePalette(company.primaryColor);

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--company-primary": company.primaryColor,
          "--primary": palette.primary,
          "--primary-foreground": palette.foreground,
          "--ring": palette.ring,
        } as React.CSSProperties
      }
    >
      <Header
        companyName={company.name}
        companySlug={companySlug}
        showAdminLink={canAccessAdmin}
      />
      {children}
    </div>
  );
}
