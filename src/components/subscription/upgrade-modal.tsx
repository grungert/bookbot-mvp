"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanOption {
  tier: "PRO" | "BUSINESS";
  name: string;
  price: string;
  priceDetail: string;
  features: string[];
  isRecommended?: boolean;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: string | null;
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentTier,
}: UpgradeModalProps) {
  const t = useTranslations("pricing");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "BUSINESS" | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const plans: PlanOption[] = [
    {
      tier: "PRO",
      name: t("proPlan"),
      price: "$29",
      priceDetail: t("perMonth"),
      features: [
        t("proFeature1"),
        t("proFeature2"),
        t("proFeature3"),
        t("proFeature4"),
        t("proFeature5"),
      ],
      isRecommended: true,
    },
    {
      tier: "BUSINESS",
      name: t("businessPlan"),
      price: "$99",
      priceDetail: t("perMonth"),
      features: [
        t("businessFeature1"),
        t("businessFeature2"),
        t("businessFeature3"),
        t("businessFeature4"),
        t("businessFeature5"),
        t("businessFeature6"),
      ],
    },
  ];

  const handleSelectPlan = (tier: "PRO" | "BUSINESS") => {
    setSelectedPlan(tier);
    setShowConfirmation(true);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setIsUpgrading(true);
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier: selectedPlan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upgrade");
      }

      toast.success(t("upgradeSuccess"));
      onOpenChange(false);
      setShowConfirmation(false);
      setSelectedPlan(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setSelectedPlan(null);
  };

  if (showConfirmation && selectedPlan) {
    const plan = plans.find((p) => p.tier === selectedPlan)!;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("confirmUpgrade")}</DialogTitle>
            <DialogDescription>
              {t("confirmUpgradeDescription", { plan: plan.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{plan.name}</span>
                <span className="text-lg font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.priceDetail}
                  </span>
                </span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("upgradeNote")}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              {tCommon("back")}
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="flex-1"
            >
              {isUpgrading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {t("confirmUpgradeButton")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("upgradePlan")}</DialogTitle>
          <DialogDescription>
            {t("upgradeDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 py-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.tier;
            const isDowngrade =
              currentTier === "BUSINESS" && plan.tier === "PRO";

            return (
              <div
                key={plan.tier}
                className={cn(
                  "relative rounded-xl border-2 p-4 transition-all",
                  plan.isRecommended && "border-primary shadow-sm",
                  !plan.isRecommended && "border-muted hover:border-primary/50",
                  isCurrentPlan && "opacity-60"
                )}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-3 left-4">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                      {t("recommended")}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">
                        {plan.priceDetail}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isCurrentPlan || isDowngrade}
                    variant={plan.isRecommended ? "default" : "outline"}
                    className="w-full mt-4"
                  >
                    {isCurrentPlan
                      ? t("currentPlan")
                      : isDowngrade
                      ? t("downgradeNotAllowed")
                      : t("selectPlan")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {t("contactForBusiness")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
