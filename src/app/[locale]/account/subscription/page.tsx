import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SubscriptionPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user's primary company
  const membership = await prisma.companyMembership.findFirst({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { isPrimary: "desc" },
  });

  // If user has a company, redirect to admin settings subscription tab
  if (membership) {
    redirect(`/${locale}/c/${membership.company.slug}/admin/settings#subscription`);
  }

  // If no company, redirect to onboarding
  redirect(`/${locale}/onboarding`);
}
