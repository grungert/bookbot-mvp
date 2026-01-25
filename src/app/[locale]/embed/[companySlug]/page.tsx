import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChatWidget } from "@/components/chat/chat-widget";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/subscription/limits";
import { getTrialStatus } from "@/lib/subscription/trial";

interface EmbedPageProps {
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const company = await getCompanyBySlug(companySlug);
  const t = await getTranslations("admin");

  if (!company) {
    notFound();
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Example Website Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-semibold text-slate-800">Example Website</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <span className="hover:text-slate-900 cursor-pointer">Home</span>
            <span className="hover:text-slate-900 cursor-pointer">Products</span>
            <span className="hover:text-slate-900 cursor-pointer">Services</span>
            <span className="hover:text-slate-900 cursor-pointer">About</span>
            <span className="hover:text-slate-900 cursor-pointer">Contact</span>
          </nav>
        </div>
      </header>

      {/* Example Website Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            {t("embedPreviewBadge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {t("embedPreviewTitle")}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("embedPreviewSubtitle", { companyName: company.name })}
          </p>
        </div>

        {/* Example Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">{t("embedFeature1")}</h3>
            <p className="text-sm text-slate-600">{t("embedFeature1Desc")}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">{t("embedFeature2")}</h3>
            <p className="text-sm text-slate-600">{t("embedFeature2Desc")}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">{t("embedFeature3")}</h3>
            <p className="text-sm text-slate-600">{t("embedFeature3Desc")}</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            {t("embedCTATitle")}
          </h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            {t("embedCTADesc")}
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{ backgroundColor: `${company.primaryColor}15`, color: company.primaryColor }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: company.primaryColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: company.primaryColor }}
              />
            </span>
            {t("embedCTAHint")}
          </div>
        </div>
      </main>

      {/* Example Website Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-slate-500">
            <p className="mb-2">{t("embedPreviewNote")}</p>
            <p className="text-xs text-slate-400">
              Powered by <span className="font-medium" style={{ color: company.primaryColor }}>{company.name}</span>
            </p>
          </div>
        </div>
      </footer>

      {/* The actual chat widget */}
      {hasChatbotAccess && (
        <ChatWidget companySlug={companySlug} primaryColor={company.primaryColor} />
      )}
    </div>
  );
}
