"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { AlertTriangle, Crown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpiredOverlayProps {
  status: "TRIAL_EXPIRED" | "PAST_DUE" | "CANCELLED";
}

export function ExpiredOverlay({ status }: ExpiredOverlayProps) {
  const t = useTranslations("subscription");

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
          <Link href="/pricing">
            <Button size="lg" className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              {status === "CANCELLED" ? t("resubscribe") : t("viewPricing")}
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="w-full">
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("contactSupport")}
            </Button>
          </Link>
        </div>

        {/* Additional info */}
        <p className="text-xs text-muted-foreground mt-6">
          {t("expiredOverlayNote")}
        </p>
      </div>
    </div>
  );
}
