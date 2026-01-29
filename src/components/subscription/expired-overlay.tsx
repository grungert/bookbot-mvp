"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

interface ExpiredOverlayProps {
  status: "TRIAL_EXPIRED" | "PAST_DUE" | "CANCELLED";
  supportEmail?: string;
  currentTier?: string | null;
  hasChatbot?: boolean;
  primaryColor?: string | null;
  currentCompanyCount?: number;
  hasPendingUpgrade?: boolean;
}

export function ExpiredOverlay({
  status,
  supportEmail,
  currentTier,
  hasChatbot,
  primaryColor,
  currentCompanyCount,
  hasPendingUpgrade: initialHasPendingUpgrade = false,
}: ExpiredOverlayProps) {
  const t = useTranslations("subscription");
  const tUpgrade = useTranslations("upgrade");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasPendingUpgrade, setHasPendingUpgrade] = useState(initialHasPendingUpgrade);

  const config = {
    TRIAL_EXPIRED: {
      icon: AlertTriangle,
      titleKey: "trialExpired",
      descriptionKey: "trialExpiredFullDescription",
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    PAST_DUE: {
      icon: AlertTriangle,
      titleKey: "paymentOverdue",
      descriptionKey: "paymentOverdueFullDescription",
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    CANCELLED: {
      icon: AlertTriangle,
      titleKey: "subscriptionCancelled",
      descriptionKey: "subscriptionCancelledFullDescription",
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  };

  const { icon: Icon, titleKey, descriptionKey, iconColor, bgColor } = config[status];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="max-w-md mx-auto p-8 text-center">
          {/* Icon */}
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}>
            <Icon className={`h-10 w-10 ${iconColor}`} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">
            {t(titleKey)}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8">
            {t(descriptionKey)}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {hasPendingUpgrade ? (
              <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      {tUpgrade("pendingPayment")}
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {tUpgrade("pendingPaymentDescription")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Button size="lg" className="w-full" onClick={() => setShowUpgradeModal(true)}>
                <Crown className="h-4 w-4 mr-2" />
                {status === "CANCELLED" ? t("resubscribe") : t("viewPricing")}
              </Button>
            )}
            <Link href="/">
              <Button variant="ghost" size="lg" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>

          {/* Support email */}
          <p className="text-sm text-muted-foreground mt-6">
            {supportEmail ? (
              t.rich("contactSupportEmail", {
                email: supportEmail,
                link: (chunks) => (
                  <a href={`mailto:${supportEmail}`} className="font-medium text-primary hover:underline">
                    {chunks}
                  </a>
                ),
              })
            ) : (
              t("expiredOverlayNote")
            )}
          </p>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onSuccess={() => setHasPendingUpgrade(true)}
        currentTier={currentTier}
        hasChatbot={hasChatbot}
        primaryColor={primaryColor}
        currentCompanyCount={currentCompanyCount}
      />
    </>
  );
}
