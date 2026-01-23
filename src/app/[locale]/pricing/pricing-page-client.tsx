"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  X,
  Crown,
  Building2,
  MessageSquare,
  FileText,
  Palette,
  Headphones,
  ChevronDown,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

interface Plan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string | null;
  priceMonthly: number;
  baseCompanies: number;
  maxCompanies: number;
  extraCompanyPrice: number | null;
  maxChatMessagesPerMonth: number;
  maxDocumentsPerCompany: number | null;
  customBranding: boolean;
  prioritySupport: boolean;
  trialDays: number | null;
}

interface PricingPageClientProps {
  plans: Plan[];
  currentSubscription: {
    planTier: PlanTier;
    status: SubscriptionStatus;
  } | null;
  isLoggedIn: boolean;
}

// Feature comparison data
const featureCategories = [
  {
    name: "core",
    features: [
      { key: "companies", type: "companies" as const },
      { key: "chatMessages", type: "chat" as const },
      { key: "documents", type: "documents" as const },
    ],
  },
  {
    name: "features",
    features: [
      { key: "customBranding", type: "boolean" as const },
      { key: "prioritySupport", type: "boolean" as const },
      { key: "unlimitedServices", type: "always" as const },
      { key: "invoicing", type: "always" as const },
    ],
  },
];

export function PricingPageClient({
  plans,
  currentSubscription,
  isLoggedIn,
}: PricingPageClientProps) {
  const t = useTranslations("pricing");
  const prefersReducedMotion = useReducedMotion();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: t("faq1Question"), answer: t("faq1Answer") },
    { question: t("faq2Question"), answer: t("faq2Answer") },
    { question: t("faq3Question"), answer: t("faq3Answer") },
    { question: t("faq4Question"), answer: t("faq4Answer") },
    { question: t("faq5Question"), answer: t("faq5Answer") },
  ];

  const getPlanFeatureValue = (
    plan: Plan,
    featureType: "companies" | "chat" | "documents" | "boolean" | "always",
    featureKey: string
  ) => {
    switch (featureType) {
      case "companies":
        if (plan.baseCompanies === -1) return t("unlimited");
        if (plan.extraCompanyPrice) {
          return `${plan.baseCompanies} (+$${plan.extraCompanyPrice}/${t("extra")})`;
        }
        return plan.baseCompanies.toString();
      case "chat":
        if (plan.maxChatMessagesPerMonth === -1) return t("unlimited");
        return plan.maxChatMessagesPerMonth.toLocaleString();
      case "documents":
        if (plan.maxDocumentsPerCompany === null || plan.maxDocumentsPerCompany === -1)
          return t("unlimited");
        return plan.maxDocumentsPerCompany.toString();
      case "boolean":
        if (featureKey === "customBranding") return plan.customBranding;
        if (featureKey === "prioritySupport") return plan.prioritySupport;
        return false;
      case "always":
        return true;
    }
  };

  const getCtaButton = (plan: Plan) => {
    const isCurrentPlan = currentSubscription?.planTier === plan.tier;
    const isTrial = plan.tier === "TRIAL";

    if (isCurrentPlan) {
      return (
        <Button disabled className="w-full">
          <Check className="h-4 w-4 mr-2" />
          {t("currentPlan")}
        </Button>
      );
    }

    if (isTrial) {
      if (isLoggedIn) {
        return (
          <Button variant="outline" disabled className="w-full">
            {t("alreadyMember")}
          </Button>
        );
      }
      return (
        <Link href="/register" className="w-full">
          <Button variant="outline" className="w-full">
            {t("startFreeTrial")}
          </Button>
        </Link>
      );
    }

    if (plan.tier === "BUSINESS") {
      return (
        <Link href="/contact" className="w-full">
          <Button variant="outline" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            {t("contactUs")}
          </Button>
        </Link>
      );
    }

    if (isLoggedIn) {
      return (
        <Button onClick={() => setShowUpgradeModal(true)} className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          {t("upgrade")}
        </Button>
      );
    }

    return (
      <Link href="/register" className="w-full">
        <Button className="w-full">
          {t("getStarted")}
        </Button>
      </Link>
    );
  };

  // Sort plans: TRIAL, PRO, BUSINESS
  const sortedPlans = [...plans].sort((a, b) => {
    const order: Record<PlanTier, number> = { TRIAL: 0, PRO: 1, BUSINESS: 2 };
    return order[a.tier] - order[b.tier];
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-bold text-xl">
            BookBot
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/user">
                <Button variant="outline" size="sm">
                  {t("myAccount")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t("login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">{t("signUp")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t("heroSubtitle")}
          </p>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {sortedPlans.map((plan, index) => {
            const isPopular = plan.tier === "PRO";
            const isCurrentPlan = currentSubscription?.planTier === plan.tier;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                }}
                className={cn(isPopular && "md:-mt-4 md:mb-4")}
              >
                <div
                  className={cn(
                    "relative h-full rounded-xl border-2 bg-card p-6 transition-shadow hover:shadow-lg",
                    isPopular && "border-primary shadow-md",
                    !isPopular && "border-border",
                    isCurrentPlan && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                        {t("mostPopular")}
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                        {t("yourPlan")}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="text-center mb-6 pt-2">
                    <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        {plan.priceMonthly === 0
                          ? t("free")
                          : `$${plan.priceMonthly}`}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-muted-foreground">
                          /{t("month")}
                        </span>
                      )}
                    </div>
                    {plan.tier === "TRIAL" && plan.trialDays && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("trialDuration", { days: plan.trialDays })}
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>
                        {plan.baseCompanies === -1
                          ? t("unlimitedCompanies")
                          : t("companiesCount", { count: plan.baseCompanies })}
                        {plan.extraCompanyPrice && (
                          <span className="text-muted-foreground">
                            {" "}(+${plan.extraCompanyPrice}/{t("extra")})
                          </span>
                        )}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>
                        {plan.maxChatMessagesPerMonth === -1
                          ? t("unlimitedChatMessages")
                          : t("chatMessagesCount", {
                              count: plan.maxChatMessagesPerMonth,
                            })}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>
                        {plan.maxDocumentsPerCompany === null ||
                        plan.maxDocumentsPerCompany === -1
                          ? t("unlimitedDocuments")
                          : t("documentsCount", {
                              count: plan.maxDocumentsPerCompany,
                            })}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      {plan.customBranding ? (
                        <Palette className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          !plan.customBranding && "text-muted-foreground"
                        )}
                      >
                        {t("customBranding")}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      {plan.prioritySupport ? (
                        <Headphones className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          !plan.prioritySupport && "text-muted-foreground"
                        )}
                      >
                        {t("prioritySupport")}
                      </span>
                    </li>
                  </ul>

                  {/* CTA */}
                  {getCtaButton(plan)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          className="max-w-5xl mx-auto mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            {t("compareFeatures")}
          </h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">{t("feature")}</th>
                    {sortedPlans.map((plan) => (
                      <th
                        key={plan.id}
                        className={cn(
                          "p-4 text-center font-semibold",
                          plan.tier === "PRO" && "bg-primary/5"
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((category) =>
                    category.features.map((feature, idx) => (
                      <tr key={feature.key} className="border-b last:border-0">
                        <td className="p-4 text-sm">{t(`feature_${feature.key}`)}</td>
                        {sortedPlans.map((plan) => {
                          const value = getPlanFeatureValue(
                            plan,
                            feature.type,
                            feature.key
                          );
                          return (
                            <td
                              key={plan.id}
                              className={cn(
                                "p-4 text-center text-sm",
                                plan.tier === "PRO" && "bg-primary/5"
                              )}
                            >
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check className="h-5 w-5 text-primary mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="font-medium">{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            {t("faqTitle")}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border bg-card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
                >
                  {faq.question}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform",
                      expandedFaq === index && "rotate-180"
                    )}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-24 py-16 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          {isLoggedIn ? (
            <Button size="lg" onClick={() => setShowUpgradeModal(true)}>
              <Crown className="h-5 w-5 mr-2" />
              {t("upgrade")}
            </Button>
          ) : (
            <Link href="/register">
              <Button size="lg">
                {t("startFreeTrial")}
              </Button>
            </Link>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            {t("noCardRequired")}
          </p>
        </motion.div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentTier={currentSubscription?.planTier}
      />
    </div>
  );
}
