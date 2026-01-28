"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Copy,
  CheckCircle,
  Euro,
  Coins,
} from "lucide-react";
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
import { formatTokenCount } from "@/lib/utils/format-tokens";

interface BuyTokensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface TokenPack {
  id: string;
  name: string;
  tokenAmount: number;
  priceEurCents: number;
}

export function BuyTokensModal({
  open,
  onOpenChange,
  onSuccess,
}: BuyTokensModalProps) {
  const t = useTranslations("tokenPurchase");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState(1);
  const [packs, setPacks] = useState<TokenPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedPack = packs.find((p) => p.id === selectedPackId) ?? null;

  const formatPrice = (cents: number) => `\u20AC${(cents / 100).toFixed(2)}`;

  // Fetch token packs when modal opens
  useEffect(() => {
    if (open) {
      setLoadingPacks(true);
      fetch("/api/token-packs")
        .then((res) => res.json())
        .then((data) => {
          if (data.packs) {
            setPacks(data.packs);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPacks(false));
    }
  }, [open]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedPackId(null);
      setIsSubmitting(false);
      setSubmitted(false);
      setPaymentReference("");
      setCopied(false);
    }
  }, [open]);

  const totalSteps = 3;

  const handleSubmit = async () => {
    if (!selectedPackId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/subscription/token-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenPackId: selectedPackId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit token purchase");
      }

      setPaymentReference(data.paymentReference);
      setSubmitted(true);
      toast.success(t("purchaseSubmitted"));
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(paymentReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("referenceCopied"));
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  // Step 1: Select Pack
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{t("selectPack")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("selectPackDescription")}
        </p>
      </div>

      {loadingPacks ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <div
              key={pack.id}
              onClick={() => setSelectedPackId(pack.id)}
              className={cn(
                "relative p-4 rounded-xl border bg-card cursor-pointer transition-all",
                selectedPackId === pack.id
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor:
                      selectedPackId === pack.id
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                  }}
                >
                  {selectedPackId === pack.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{pack.name}</span>
                    <span className="font-bold text-primary">
                      {formatPrice(pack.priceEurCents)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatTokenCount(pack.tokenAmount)} {t("tokens")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 2: Summary
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Euro className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{t("summary")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("summaryDescription")}
        </p>
      </div>

      {selectedPack && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("selectedPack")}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{selectedPack.name}</span>
              </div>
              <span className="font-medium">
                {formatTokenCount(selectedPack.tokenAmount)} {t("tokens")}
              </span>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t("total")}</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(selectedPack.priceEurCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {t("bankTransferNote")}
        </p>
      </div>
    </div>
  );

  // Step 3: Confirm + Success
  const renderStep3 = () => {
    if (submitted) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {t("purchaseSubmittedTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("purchaseSubmittedDescription")}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("bankDetails")}
            </h4>
            {selectedPack && (
              <div className="rounded-lg bg-muted/50 p-3 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("amount")}</span>
                  <span className="font-medium">
                    {formatPrice(selectedPack.priceEurCents)}
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-2">
                {t("paymentReference")}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg text-yellow-800 dark:text-yellow-200">
                  {paymentReference}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyReference}
                  className="h-8 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("emailSent")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t("confirmPurchase")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("confirmPurchaseDescription")}
          </p>
        </div>

        {selectedPack && (
          <div className="rounded-xl border bg-card p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("summary")}
            </h4>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("pack")}</span>
                <span className="font-medium">{selectedPack.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("tokens")}</span>
                <span className="font-medium">
                  {formatTokenCount(selectedPack.tokenAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-medium">{t("total")}</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(selectedPack.priceEurCents)}
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {t("confirmNote")}
        </p>
      </div>
    );
  };

  const renderNavigation = () => {
    if (submitted) {
      return (
        <Button onClick={() => onOpenChange(false)} className="w-full">
          {tCommon("close")}
        </Button>
      );
    }

    return (
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon("back")}
          </Button>
        )}
        {step < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={step === 1 && !selectedPackId}
            className="flex-1"
          >
            {tCommon("next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Coins className="h-4 w-4 mr-2" />
            )}
            {t("submitPurchase")}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {t("buyTokens")}
          </DialogTitle>
          <DialogDescription>
            {!submitted && (
              <span className="flex items-center gap-2 mt-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i + 1 <= step ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {renderNavigation()}
      </DialogContent>
    </Dialog>
  );
}
