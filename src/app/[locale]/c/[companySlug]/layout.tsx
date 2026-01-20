import { notFound } from "next/navigation";
import { getCompanyBySlug, checkUserCompanyAccess } from "@/lib/db/tenant";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/navigation/header";
import { ChatWidget } from "@/components/chat/chat-widget";
import { generateThemePalette } from "@/lib/utils/colors";
import { prisma } from "@/lib/prisma";

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
  const isLoggedIn = !!user;
  const canAccessAdmin = user?.role === "COMPANY_ADMIN" || user?.role === "SUPER_ADMIN"
    ? await checkUserCompanyAccess(user.id, company.id)
    : false;

  // Get upcoming appointments count for the user
  // Admin users see all company appointments, regular users see only their own
  let appointmentCount = 0;
  if (user) {
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "COMPANY_ADMIN";

    appointmentCount = await prisma.appointment.count({
      where: {
        companyId: company.id,
        // Admin sees all company appointments, regular users see only their own
        ...(isAdmin ? {} : { userId: user.id }),
        startTime: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
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
      <Header
        companyName={company.name}
        companySlug={companySlug}
        companyLogo={company.logoUrl}
        headerDisplayMode={company.headerDisplayMode}
        showAdminLink={canAccessAdmin}
        showMyAppointments={isLoggedIn}
        appointmentCount={appointmentCount}
      />
      {children}
      <ChatWidget companySlug={companySlug} primaryColor={company.primaryColor} />
    </div>
  );
}
