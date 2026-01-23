import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect to subscription page by default
  redirect(`/${locale}/account/subscription`);
}
