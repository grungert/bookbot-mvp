"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { AlertTriangle, ArrowLeft, Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { MainNav } from "@/components/navigation/main-nav";

// Lazy load sphere background
const SphereBackground = dynamic(
  () => import("@/components/landing/sphere-background").then((mod) => mod.SphereBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-violet-400/5 to-transparent" />
    ),
  }
);

// Scrolling grid background
function ScrollingGrid() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom right, black 0%, black 20%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom right, black 0%, black 20%, transparent 70%)",
          filter: "drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))"
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)
          `
        }}
      />
    </div>
  );
}

interface ExpiredOverlayProps {
  status: "TRIAL_EXPIRED" | "PAST_DUE" | "CANCELLED";
  supportEmail?: string;
  currentTier?: string | null;
  hasChatbot?: boolean;
  primaryColor?: string | null;
  currentCompanyCount?: number;
  hasPendingUpgrade?: boolean;
  defaultOpenModal?: boolean;
  defaultSelectedPlan?: "PRO" | "BUSINESS";
}

export function ExpiredOverlay({
  status,
  supportEmail,
  currentTier,
  hasChatbot,
  primaryColor,
  currentCompanyCount,
  hasPendingUpgrade: initialHasPendingUpgrade = false,
  defaultOpenModal = false,
  defaultSelectedPlan,
}: ExpiredOverlayProps) {
  const t = useTranslations("subscription");
  const tUpgrade = useTranslations("upgrade");
  const searchParams = useSearchParams();
  const hasProcessedParam = useRef(false);

  // Check for openUpgrade query param
  const openUpgradeParam = searchParams.get("openUpgrade");
  const shouldOpenModal = defaultOpenModal || (openUpgradeParam === "PRO" || openUpgradeParam === "BUSINESS");
  const selectedPlan = defaultSelectedPlan || (openUpgradeParam as "PRO" | "BUSINESS" | null) || undefined;

  const [showUpgradeModal, setShowUpgradeModal] = useState(shouldOpenModal);
  const [hasPendingUpgrade, setHasPendingUpgrade] = useState(initialHasPendingUpgrade);

  // Handle URL param cleanup and modal opening
  useEffect(() => {
    if (hasProcessedParam.current) return;
    if (openUpgradeParam && (openUpgradeParam === "PRO" || openUpgradeParam === "BUSINESS")) {
      hasProcessedParam.current = true;
      // Open modal
      queueMicrotask(() => {
        setShowUpgradeModal(true);
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [openUpgradeParam]);

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
      <div className="fixed inset-0 z-40 min-h-screen bg-background">
        {/* Sphere background */}
        <div className="fixed inset-0 z-0">
          <SphereBackground />
        </div>

        {/* Scrolling grid */}
        <ScrollingGrid />

        {/* Navigation */}
        <div className="relative z-20">
          <MainNav />
        </div>

        {/* Content */}
        <div className="relative z-20 flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-white/20 dark:border-gray-700/30 shadow-xl">
            <CardContent className="p-8 text-center">
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
                  <Button variant="gradient" size="lg" className="w-full" onClick={() => setShowUpgradeModal(true)}>
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
            </CardContent>
          </Card>
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
        defaultSelectedPlan={selectedPlan}
      />
    </>
  );
}
