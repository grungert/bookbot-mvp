import { notFound } from "next/navigation";
import { getCompanyBySlug, checkUserCompanyAccess } from "@/lib/db/tenant";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/navigation/header";
import { ChatWidget } from "@/components/chat/chat-widget";
import { generateThemePalette } from "@/lib/utils/colors";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/subscription/limits";
import { getTrialStatus } from "@/lib/subscription/trial";
import { checkChatLimit } from "@/lib/subscription/usage";

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

  // Check if user can access admin (based on company membership, not role)
  const user = await getCurrentUser();
  const isLoggedIn = !!user;
  const canAccessAdmin = user
    ? await checkUserCompanyAccess(user.id, company.id)
    : false;

  // Get upcoming appointments count for the user across ALL companies
  let appointmentCount = 0;
  if (user) {
    appointmentCount = await prisma.appointment.count({
      where: {
        userId: user.id,
        startTime: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  }

  // Generate theme palette from company's primary color
  const palette = generateThemePalette(company.primaryColor);

  // Check chatbot access for the company owner
  const ownerMembership = await prisma.companyMembership.findFirst({
    where: {
      companyId: company.id,
      role: "OWNER",
    },
    select: { userId: true },
  });

  let hasChatbotAccess = false;
  if (ownerMembership) {
    const [subscription, trialStatus] = await Promise.all([
      getUserSubscription(ownerMembership.userId),
      getTrialStatus(ownerMembership.userId),
    ]);
    if (subscription) {
      hasChatbotAccess =
        subscription.plan.tier === "BUSINESS" ||
        subscription.hasChatbot === true ||
        (subscription.status === "TRIALING" && trialStatus.isExpired === false);
    }
  }

  // Also check token limit — hide widget if tokens exhausted
  let isChatAvailable = hasChatbotAccess;
  if (hasChatbotAccess && ownerMembership) {
    const limitResult = await checkChatLimit(ownerMembership.userId);
    if (!limitResult.allowed) {
      isChatAvailable = false;
    }
  }

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
      {isChatAvailable && (
        <ChatWidget companySlug={companySlug} primaryColor={company.primaryColor} />
      )}
    </div>
  );
}
