import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyMembershipAccess } from "@/lib/db/tenant";
import { AdminSidebar, AdminMobileNav, SidebarProvider, AdminMainContent } from "@/components/admin/admin-sidebar";
import { UserMenu } from "@/components/navigation/user-menu";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { TrialBannerWrapper } from "@/components/admin/trial-banner";
import { ExpiredOverlay } from "@/components/subscription/expired-overlay";
import { prisma } from "@/lib/prisma";
import { getTrialStatus } from "@/lib/subscription/trial";
import { SubscriptionStatus } from "@prisma/client";

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

  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect(`/${locale}/login`);
  }

  // Fetch fresh user data from database (session might have stale role)
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true },
  });

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

  // Get the company owner for subscription checks
  const ownerMembership = await prisma.companyMembership.findFirst({
    where: {
      companyId: company.id,
      role: "OWNER",
    },
    select: { userId: true },
  });

  const [pendingAppointmentsCount, actionableInvoicesCount, trialStatus] = await Promise.all([
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
    ownerMembership ? getTrialStatus(ownerMembership.userId) : Promise.resolve(null),
  ]);

  // Prepare subscription data for the trial banner
  const subscriptionData = trialStatus ? {
    status: trialStatus.status,
    daysRemaining: trialStatus.daysRemaining,
    trialEndsAt: trialStatus.trialEndsAt?.toISOString() ?? null,
    planName: trialStatus.planTier,
  } : null;

  // Check if subscription is blocked (expired or cancelled)
  const blockedStatuses: SubscriptionStatus[] = ["TRIAL_EXPIRED", "PAST_DUE", "CANCELLED"];
  const isBlocked = trialStatus?.status && blockedStatuses.includes(trialStatus.status as SubscriptionStatus);

  // If blocked, show the expired overlay
  if (isBlocked) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-muted/30 relative">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4">
              <span className="font-semibold">{company.name}</span>
              <div className="ml-auto flex items-center gap-1">
                <LanguageSwitcher />
                <UserMenu showDashboardLink={false} />
              </div>
            </div>
          </header>
          <ExpiredOverlay status={trialStatus.status as "TRIAL_EXPIRED" | "PAST_DUE" | "CANCELLED"} />
        </div>
      </SidebarProvider>
    );
  }

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
        {/* Trial/Subscription status banner */}
        <TrialBannerWrapper subscription={subscriptionData} />
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
