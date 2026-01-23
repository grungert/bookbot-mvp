"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  CreditCard,
  Building2,
  MessageSquare,
  FileText,
  Sparkles,
  Clock,
  AlertTriangle,
  Check,
  Plus,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageMeter } from "@/components/subscription/usage-meter";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { cn } from "@/lib/utils";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

interface SubscriptionDashboardClientProps {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    planTier: PlanTier;
    planName: string;
    trialEndsAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    extraCompanySlots: number;
    plan: {
      priceMonthly: number;
      baseCompanies: number;
      maxCompanies: number;
      extraCompanyPrice: number | null;
      maxChatMessagesPerMonth: number;
      maxDocumentsPerCompany: number | null;
      customBranding: boolean;
      prioritySupport: boolean;
    };
  } | null;
  companySlots: {
    baseSlots: number;
    extraSlots: number;
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    unlimited: boolean;
  };
  chatUsage: {
    currentPeriod: {
      start: string;
      end: string;
      used: number;
      limit: number;
      unlimited: boolean;
      percentUsed: number;
    };
  };
  trialStatus: {
    isTrialing: boolean;
    isExpired: boolean;
    daysRemaining: number;
  };
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    documentCount: number;
  }>;
}

const statusConfig: Record<
  SubscriptionStatus,
  { color: string; bgColor: string; icon: typeof Check }
> = {
  ACTIVE: { color: "text-green-600", bgColor: "bg-green-100", icon: Check },
  TRIALING: { color: "text-blue-600", bgColor: "bg-blue-100", icon: Clock },
  TRIAL_EXPIRED: { color: "text-destructive", bgColor: "bg-red-100", icon: AlertTriangle },
  PAST_DUE: { color: "text-amber-600", bgColor: "bg-amber-100", icon: AlertTriangle },
  CANCELLED: { color: "text-muted-foreground", bgColor: "bg-muted", icon: AlertTriangle },
};

export function SubscriptionDashboardClient({
  subscription,
  companySlots,
  chatUsage,
  trialStatus,
  companies,
}: SubscriptionDashboardClientProps) {
  const t = useTranslations("account");
  const tSub = useTranslations("subscription");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const status = subscription?.status ?? "TRIAL_EXPIRED";
  const StatusIcon = statusConfig[status]?.icon ?? AlertTriangle;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("subscription")}</h1>
          <p className="text-muted-foreground">{t("subscriptionSubtitle")}</p>
        </div>

        <div className="rounded-xl border bg-card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("noSubscription")}</h2>
          <p className="text-muted-foreground mb-6">{t("noSubscriptionDescription")}</p>
          <Link href="/pricing">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              {t("viewPlans")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("subscription")}</h1>
          <p className="text-muted-foreground">{t("subscriptionSubtitle")}</p>
        </div>
        {subscription.planTier !== "BUSINESS" && (
          <Button onClick={() => setShowUpgradeModal(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            {tSub("upgradePlan")}
          </Button>
        )}
      </div>

      {/* Current Plan Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                statusConfig[status].bgColor
              )}
            >
              <CreditCard className={cn("h-6 w-6", statusConfig[status].color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{subscription.planName}</h2>
                <Badge
                  variant="outline"
                  className={cn(statusConfig[status].color)}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {t(`status_${status}`)}
                </Badge>
              </div>
              {trialStatus.isTrialing && (
                <p className="text-sm text-muted-foreground">
                  {tSub("trialDaysRemaining", { days: trialStatus.daysRemaining })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billing Period */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 pb-6 border-b">
          <Calendar className="h-4 w-4" />
          <span>
            {t("billingPeriod")}: {formatDate(subscription.currentPeriodStart)} -{" "}
            {formatDate(subscription.currentPeriodEnd)}
          </span>
        </div>

        {/* Usage Meters */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Chat Messages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">{t("chatMessages")}</span>
            </div>
            <UsageMeter
              label=""
              used={chatUsage.currentPeriod.used}
              limit={chatUsage.currentPeriod.limit}
              unlimited={chatUsage.currentPeriod.unlimited}
              showPercentage={true}
            />
            <p className="text-xs text-muted-foreground">
              {t("resetsOn", { date: formatDate(chatUsage.currentPeriod.end) })}
            </p>
          </div>

          {/* Companies */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium">{t("companies")}</span>
            </div>
            <UsageMeter
              label=""
              used={companySlots.usedSlots}
              limit={companySlots.totalSlots}
              unlimited={companySlots.unlimited}
              showPercentage={true}
            />
            {subscription.plan.extraCompanyPrice && !companySlots.unlimited && (
              <p className="text-xs text-muted-foreground">
                {t("extraCompanySlot", { price: subscription.plan.extraCompanyPrice })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t("yourCompanies")}</h3>
          {companySlots.availableSlots !== 0 && (
            <Link href="/user">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("createCompany")}
              </Button>
            </Link>
          )}
        </div>

        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCompanies")}</p>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => {
              const docLimit = subscription.plan.maxDocumentsPerCompany;
              const docUnlimited = docLimit === null || docLimit === -1;

              return (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {docUnlimited
                          ? t("documentsUnlimited", { count: company.documentCount })
                          : t("documentsUsed", {
                              used: company.documentCount,
                              limit: docLimit,
                            })}
                      </div>
                    </div>
                  </div>
                  <Link href={`/c/${company.slug}/admin`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan Features */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">{t("planFeatures")}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            {subscription.plan.customBranding ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(!subscription.plan.customBranding && "text-muted-foreground")}>
              {t("customBranding")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {subscription.plan.prioritySupport ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(!subscription.plan.prioritySupport && "text-muted-foreground")}>
              {t("prioritySupport")}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentTier={subscription.planTier}
      />
    </div>
  );
}
