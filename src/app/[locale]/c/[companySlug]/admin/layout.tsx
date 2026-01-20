import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyMembershipAccess } from "@/lib/db/tenant";
import { AdminSidebar, AdminMobileNav, SidebarProvider, AdminMainContent } from "@/components/admin/admin-sidebar";
import { UserMenu } from "@/components/navigation/user-menu";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { prisma } from "@/lib/prisma";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Only super admin and company admin can access
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
    redirect(`/${locale}/c/${companySlug}`);
  }

  // Validate company access using membership (supports multi-company)
  const { error, company } = await validateCompanyMembershipAccess(companySlug);

  if (error || !company) {
    redirect(`/${locale}`);
  }

  const [pendingAppointmentsCount, actionableInvoicesCount] = await Promise.all([
    prisma.appointment.count({
      where: {
        companyId: company.id,
        status: "PENDING",
      },
    }),
    prisma.invoice.count({
      where: {
        companyId: company.id,
        OR: [
          { status: "DRAFT" },
          {
            status: "SENT",
            dueDate: { lt: new Date() },
          },
        ],
      },
    }),
  ]);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <AdminMobileNav
              companySlug={companySlug}
              companyName={company.name}
              primaryColor={company.primaryColor}
              pendingAppointmentsCount={pendingAppointmentsCount}
              actionableInvoicesCount={actionableInvoicesCount}
            />
            <span className="font-semibold ml-2">{company.name}</span>
            <div className="ml-auto flex items-center gap-1">
              <LanguageSwitcher />
              <UserMenu showDashboardLink={false} />
            </div>
          </div>
        </header>
        <div className="flex">
          <AdminSidebar
            companySlug={companySlug}
            companyName={company.name}
            primaryColor={company.primaryColor}
            pendingAppointmentsCount={pendingAppointmentsCount}
            actionableInvoicesCount={actionableInvoicesCount}
          />
          <AdminMainContent>{children}</AdminMainContent>
        </div>
      </div>
    </SidebarProvider>
  );
}
