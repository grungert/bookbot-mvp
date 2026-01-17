import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { setRequestLocale } from "next-intl/server";

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

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--company-primary": company.primaryColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
