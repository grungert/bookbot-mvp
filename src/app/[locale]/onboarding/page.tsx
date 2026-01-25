import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingClient } from "./onboarding-client";

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
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

  // Check if user has any companies
  const membership = await prisma.companyMembership.findFirst({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { isPrimary: "desc" },
  });

  // If user has a company, redirect to their admin dashboard
  if (membership) {
    redirect(`/${locale}/c/${membership.company.slug}/admin`);
  }

  // User has no company - show company creation form
  // Any authenticated user can create a company
  return <OnboardingClient canCreateCompany={true} locale={locale} />;
}
