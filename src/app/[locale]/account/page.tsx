import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user has any companies
  const membership = await prisma.companyMembership.findFirst({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { isPrimary: "desc" },
  });

  // If user has no company, redirect to onboarding
  if (!membership) {
    redirect(`/${locale}/onboarding`);
  }

  // User has a company - redirect to subscription page
  redirect(`/${locale}/account/subscription`);
}
