"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Clock, AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/admin/admin-sidebar";

export interface TrialBannerProps {
  status: "TRIALING" | "TRIAL_EXPIRED" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | null;
  daysRemaining: number;
  trialEndsAt: string | null;
  planName: string | null;
}

export function TrialBanner({
  status,
  daysRemaining,
  trialEndsAt,
  planName,
}: TrialBannerProps) {
  const t = useTranslations("subscription");
  const [mounted, setMounted] = useState(false);
  const { isCollapsed } = useSidebar();
  const params = useParams();
  const companySlug = params.companySlug as string;
  const upgradeHref = `/c/${companySlug}/admin/settings?upgrade=true#subscription`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show banner for active paid subscriptions
  if (!mounted || !status || status === "ACTIVE") {
    return null;
  }

  const bannerContentClass = cn(
    "flex items-center justify-between gap-4",
    isCollapsed ? "lg:ml-16" : "lg:ml-64"
  );

  // Trial expired - show urgent banner
  if (status === "TRIAL_EXPIRED") {
    return (
      <>
        <div className="bg-destructive/15 border-b border-destructive/20 px-4 py-3">
          <div className={bannerContentClass}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">
                  {t("trialExpired")}
                </p>
                <p className="text-sm text-destructive/80">
                  {t("trialExpiredDescription")}
                </p>
              </div>
            </div>
            <Link href={upgradeHref}>
              <Button
                size="sm"
                variant="destructive"
              >
                <Crown className="h-4 w-4 mr-2" />
                {t("upgradePlan")}
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Past due - show warning
  if (status === "PAST_DUE") {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-3">
        <div className={bannerContentClass}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-500">
                {t("paymentOverdue")}
              </p>
              <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                {t("paymentOverdueDescription")}
              </p>
            </div>
          </div>
          <Link href="/#pricing">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t("updatePayment")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Cancelled - show info
  if (status === "CANCELLED") {
    return (
      <>
        <div className="bg-muted border-b px-4 py-3">
          <div className={bannerContentClass}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted-foreground/20">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  {t("subscriptionCancelled")}
                </p>
                <p className="text-sm text-muted-foreground/80">
                  {t("subscriptionCancelledDescription")}
                </p>
              </div>
            </div>
            <Link href={upgradeHref}>
              <Button
                size="sm"
                variant="secondary"
              >
                <Crown className="h-4 w-4 mr-2" />
                {t("resubscribe")}
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Active trial - show countdown
  if (status === "TRIALING") {
    const isUrgent = daysRemaining <= 3;
    const formattedEndDate = trialEndsAt
      ? new Date(trialEndsAt).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return (
      <>
        <div
          className={cn(
            "border-b px-4 py-3",
            isUrgent
              ? "bg-amber-500/15 border-amber-500/20"
              : "bg-primary/5 border-primary/10"
          )}
        >
          <div className={bannerContentClass}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  isUrgent ? "bg-amber-500/20" : "bg-primary/10"
                )}
              >
                <Clock
                  className={cn(
                    "h-4 w-4",
                    isUrgent ? "text-amber-600" : "text-primary"
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "font-medium",
                    isUrgent
                      ? "text-amber-700 dark:text-amber-500"
                      : "text-primary"
                  )}
                >
                  {t("trialBannerTitle")} - {t("trialDaysRemaining", { days: daysRemaining })}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    isUrgent
                      ? "text-amber-600/80 dark:text-amber-500/80"
                      : "text-primary/70"
                  )}
                >
                  {formattedEndDate
                    ? t("trialBannerDescription", { date: formattedEndDate })
                    : t("trialFreeDescription")}
                </p>
              </div>
            </div>
            <Link href={upgradeHref}>
              <Button
                size="sm"
                className={cn(
                  isUrgent
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                <Crown className="h-4 w-4 mr-2" />
                {t("upgradePlan")}
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return null;
}

// Server component wrapper that fetches subscription data
export function TrialBannerWrapper({
  subscription,
}: {
  subscription: {
    status: TrialBannerProps["status"];
    daysRemaining: number;
    trialEndsAt: string | null;
    planName: string | null;
  } | null;
}) {
  if (!subscription) {
    return null;
  }

  return (
    <TrialBanner
      status={subscription.status}
      daysRemaining={subscription.daysRemaining}
      trialEndsAt={subscription.trialEndsAt}
      planName={subscription.planName}
    />
  );
}
