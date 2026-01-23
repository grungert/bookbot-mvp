"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Loader2,
  Crown,
  MessageSquare,
  Building2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Copy,
  CheckCircle,
  Euro,
  Minus,
  Plus,
  Sparkles,
  Infinity,
  Zap,
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

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentTier?: string | null;
  primaryColor?: string | null;
}

interface Pricing {
  PRO_BASE: number;
  CHATBOT_ADDON: number;
  EXTRA_COMPANY: number;
  BUSINESS_BASE: number;
}

type PlanTier = "PRO" | "BUSINESS";

export function UpgradeModal({
  open,
  onOpenChange,
  onSuccess,
  currentTier,
  primaryColor,
}: UpgradeModalProps) {
  const t = useTranslations("pricing");
  const tUpgrade = useTranslations("upgrade");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("PRO");
  const [includeChatbot, setIncludeChatbot] = useState(false);
  const [extraCompanyCount, setExtraCompanyCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [copied, setCopied] = useState(false);
  const [pricing, setPricing] = useState<Pricing>({
    PRO_BASE: 1000,
    CHATBOT_ADDON: 1000,
    EXTRA_COMPANY: 700,
    BUSINESS_BASE: 9900,
  });

  // Fetch pricing from API when modal opens
  useEffect(() => {
    if (open) {
      fetch("/api/pricing")
        .then((res) => res.json())
        .then((data) => {
          if (data.pricing) {
            setPricing(data.pricing);
          }
        })
        .catch(console.error);
    }
  }, [open]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedPlan("PRO");
      setIncludeChatbot(false);
      setExtraCompanyCount(0);
      setIsSubmitting(false);
      setSubmitted(false);
      setPaymentReference("");
    }
  }, [open]);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  // Calculate total price based on selected plan
  const calculateTotalPrice = () => {
    if (selectedPlan === "BUSINESS") {
      return pricing.BUSINESS_BASE;
    }
    const basePrice = pricing.PRO_BASE;
    const chatbotPrice = includeChatbot ? pricing.CHATBOT_ADDON : 0;
    const extraCompaniesPrice = extraCompanyCount * pricing.EXTRA_COMPANY;
    return basePrice + chatbotPrice + extraCompaniesPrice;
  };

  const totalPrice = calculateTotalPrice();

  // Helper for primary color styles
  const primaryBg = primaryColor ? { backgroundColor: primaryColor } : undefined;
  const primaryBgLight = primaryColor ? { backgroundColor: `${primaryColor}15` } : undefined;
  const primaryText = primaryColor ? { color: primaryColor } : undefined;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: selectedPlan,
          includeChatbot: selectedPlan === "BUSINESS" ? true : includeChatbot,
          extraCompanyCount: selectedPlan === "BUSINESS" ? 0 : extraCompanyCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EXISTING_PENDING_REQUEST") {
          toast.error(tUpgrade("existingPendingRequest"));
          onOpenChange(false);
          return;
        }
        throw new Error(data.error || "Failed to submit upgrade request");
      }

      setPaymentReference(data.paymentReference);
      setSubmitted(true);
      toast.success(tUpgrade("requestSubmitted"));
      // Notify parent component of successful submission
      onSuccess?.();
      // Close modal after successful submission
      onOpenChange(false);
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
    toast.success(tUpgrade("referenceCopied"));
  };

  // Get total steps based on plan (Business skips company and chatbot steps)
  const totalSteps = selectedPlan === "BUSINESS" ? 3 : 5;

  // Get actual step for progress bar
  const getProgressStep = () => {
    if (selectedPlan === "BUSINESS") {
      // Business: Step 1 (Plan) -> Step 4 (Summary) -> Step 5 (Confirm)
      if (step === 1) return 1;
      if (step === 4) return 2;
      if (step === 5) return 3;
    }
    return step;
  };

  // Sticky total price component
  const TotalPriceBar = () => (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
          >
            <Euro className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
          </div>
          <span className="text-sm text-muted-foreground">{tUpgrade("totalMonthly")}</span>
        </div>
        <span className="text-xl font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
          {formatPrice(totalPrice)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
        </span>
      </div>
    </div>
  );

  // Step 1: Plan selection (Pro vs Business)
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <Crown className="h-6 w-6" style={primaryText || { color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-semibold text-lg mb-1">{tUpgrade("choosePlan")}</h3>
        <p className="text-sm text-muted-foreground">
          {tUpgrade("choosePlanDescription")}
        </p>
      </div>

      <div className="space-y-3">
        {/* Pro Plan */}
        <div
          onClick={() => setSelectedPlan("PRO")}
          className={cn(
            "relative p-4 rounded-xl border bg-card cursor-pointer transition-all",
            selectedPlan === "PRO" ? "ring-2" : "hover:border-muted-foreground/50"
          )}
          style={selectedPlan === "PRO" ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
              style={selectedPlan === "PRO" ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
            >
              {selectedPlan === "PRO" && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Pro</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {tUpgrade("popular")}
                  </span>
                </div>
                <span className="font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
                  {formatPrice(pricing.PRO_BASE)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{tUpgrade("proDescription")}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                  <span>{tUpgrade("proFeature1")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                  <span>{tUpgrade("proFeature2")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                  <span>{tUpgrade("proFeature3")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Plan */}
        <div
          onClick={() => setSelectedPlan("BUSINESS")}
          className={cn(
            "relative p-4 rounded-xl border bg-card cursor-pointer transition-all",
            selectedPlan === "BUSINESS" ? "ring-2" : "hover:border-muted-foreground/50"
          )}
          style={selectedPlan === "BUSINESS" ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
              style={selectedPlan === "BUSINESS" ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
            >
              {selectedPlan === "BUSINESS" && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Business</span>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
                <span className="font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
                  {formatPrice(pricing.BUSINESS_BASE)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{tUpgrade("businessDescription")}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Infinity className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                  <span>{tUpgrade("businessFeature1")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Infinity className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                  <span>{tUpgrade("businessFeature2")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                  <span>{tUpgrade("businessFeature3")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Number of companies (Pro only)
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <Building2 className="h-6 w-6" style={primaryText || { color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-semibold text-lg mb-1">{tUpgrade("companiesQuestion")}</h3>
        <p className="text-sm text-muted-foreground">
          {tUpgrade("companiesDescription")}
        </p>
      </div>

      <TotalPriceBar />

      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tUpgrade("extraCompanies")}
        </h4>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {formatPrice(pricing.EXTRA_COMPANY)} {tUpgrade("perCompanyMonth")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExtraCompanyCount(Math.max(0, extraCompanyCount - 1))}
              disabled={extraCompanyCount === 0}
              className="h-9 w-9"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center font-semibold text-xl">
              {extraCompanyCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExtraCompanyCount(Math.min(10, extraCompanyCount + 1))}
              disabled={extraCompanyCount === 10}
              className="h-9 w-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{tUpgrade("includedCompany")}</span>
            <span className="font-medium">1</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{tUpgrade("extraCompanies")}</span>
            <span className="font-medium">{extraCompanyCount}</span>
          </div>
          {extraCompanyCount > 0 && (
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">{tUpgrade("extraCompaniesPrice")}</span>
              <span className="font-medium" style={primaryText || { color: 'hsl(var(--primary))' }}>
                +{formatPrice(extraCompanyCount * pricing.EXTRA_COMPANY)}/mo
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="font-medium">{tUpgrade("totalCompanies")}</span>
            <span className="font-bold">{1 + extraCompanyCount}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {tUpgrade("companiesNote")}
      </p>
    </div>
  );

  // Step 3: Chatbot selection (Pro only)
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <MessageSquare className="h-6 w-6" style={primaryText || { color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-semibold text-lg mb-1">{tUpgrade("chatbotQuestion")}</h3>
        <p className="text-sm text-muted-foreground">
          {tUpgrade("chatbotDescription")}
        </p>
      </div>

      <TotalPriceBar />

      <div className="space-y-3">
        <div
          onClick={() => setIncludeChatbot(true)}
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border bg-card cursor-pointer transition-all",
            includeChatbot ? "ring-2" : "hover:border-muted-foreground/50"
          )}
          style={includeChatbot ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={includeChatbot ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
            >
              {includeChatbot && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                />
              )}
            </div>
            <div>
              <p className="font-medium">{tUpgrade("yesChatbot")}</p>
              <p className="text-sm text-muted-foreground">{tUpgrade("chatbotBenefits")}</p>
            </div>
          </div>
          <span className="text-sm font-medium" style={primaryText || { color: 'hsl(var(--primary))' }}>
            +{formatPrice(pricing.CHATBOT_ADDON)}/mo
          </span>
        </div>

        <div
          onClick={() => setIncludeChatbot(false)}
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border bg-card cursor-pointer transition-all",
            !includeChatbot ? "ring-2" : "hover:border-muted-foreground/50"
          )}
          style={!includeChatbot ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={!includeChatbot ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
            >
              {!includeChatbot && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                />
              )}
            </div>
            <div>
              <p className="font-medium">{tUpgrade("noChatbot")}</p>
              <p className="text-sm text-muted-foreground">{tUpgrade("chatbotLater")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Price summary
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <Euro className="h-6 w-6" style={primaryText || { color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-semibold text-lg mb-1">{tUpgrade("priceSummary")}</h3>
        <p className="text-sm text-muted-foreground">
          {tUpgrade("priceSummaryDescription")}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {selectedPlan === "BUSINESS" ? "Business" : "Pro"} {tUpgrade("plan")}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
              >
                <Crown className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
              </div>
              <span className="font-medium">
                {selectedPlan === "BUSINESS" ? "Business" : tUpgrade("proBase")}
              </span>
            </div>
            <span className="font-medium">
              {formatPrice(selectedPlan === "BUSINESS" ? pricing.BUSINESS_BASE : pricing.PRO_BASE)}/mo
            </span>
          </div>

          {selectedPlan === "PRO" && includeChatbot && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  <MessageSquare className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                </div>
                <span className="font-medium">{tUpgrade("aiChatbot")}</span>
              </div>
              <span className="font-medium">+{formatPrice(pricing.CHATBOT_ADDON)}/mo</span>
            </div>
          )}

          {selectedPlan === "PRO" && extraCompanyCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  <Building2 className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                </div>
                <span className="font-medium">{tUpgrade("extraCompaniesCount", { count: extraCompanyCount })}</span>
              </div>
              <span className="font-medium">+{formatPrice(extraCompanyCount * pricing.EXTRA_COMPANY)}/mo</span>
            </div>
          )}

          {selectedPlan === "BUSINESS" && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                <span>{tUpgrade("businessFeature1")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                <span>{tUpgrade("businessFeature2")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                <span>{tUpgrade("businessFeature3")}</span>
              </div>
            </div>
          )}

          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{tUpgrade("totalMonthly")}</span>
              <span className="text-2xl font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
                {formatPrice(totalPrice)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {tUpgrade("bankTransferNote")}
        </p>
      </div>
    </div>
  );

  // Step 5: Confirmation
  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <CreditCard className="h-6 w-6" style={primaryText || { color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-semibold text-lg mb-1">{tUpgrade("confirmRequest")}</h3>
        <p className="text-sm text-muted-foreground">
          {tUpgrade("confirmDescription")}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tUpgrade("priceSummary")}
        </h4>
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tUpgrade("plan")}</span>
            <span className="font-medium">{selectedPlan === "BUSINESS" ? "Business" : "Pro"}</span>
          </div>
          {selectedPlan === "PRO" && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tUpgrade("totalCompanies")}</span>
                <span className="font-medium">{1 + extraCompanyCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tUpgrade("aiChatbot")}</span>
                <span className="font-medium">{includeChatbot ? tCommon("yes") : tCommon("no")}</span>
              </div>
            </>
          )}
          {selectedPlan === "BUSINESS" && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tUpgrade("totalCompanies")}</span>
                <span className="font-medium">{tUpgrade("unlimited")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tUpgrade("aiChatbot")}</span>
                <span className="font-medium">{tUpgrade("included")}</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-medium">{tUpgrade("totalMonthly")}</span>
            <span className="text-lg font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {tUpgrade("confirmNote")}
      </p>
    </div>
  );

  // Step 6: Success
  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{tUpgrade("requestSubmittedTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {tUpgrade("requestSubmittedDescription")}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {tUpgrade("bankDetails")}
        </h4>
        <div className="rounded-lg bg-muted/50 p-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tUpgrade("amount")}</span>
            <span className="font-medium">{formatPrice(totalPrice)}/mo</span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-2">
            {tUpgrade("paymentReference")}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-lg text-yellow-800 dark:text-yellow-200">{paymentReference}</span>
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
        {tUpgrade("emailSent")}
      </p>
    </div>
  );

  const handleNext = () => {
    if (selectedPlan === "BUSINESS") {
      // Business plan skips steps 2 and 3
      if (step === 1) setStep(4);
      else if (step === 4) setStep(5);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (selectedPlan === "BUSINESS") {
      if (step === 4) setStep(1);
      else if (step === 5) setStep(4);
    } else {
      setStep(step - 1);
    }
  };

  const isLastStep = () => {
    return step === 5;
  };

  const renderNavigation = () => {
    if (submitted) {
      return (
        <Button onClick={() => onOpenChange(false)} className="w-full" style={primaryBg}>
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
        {!isLastStep() ? (
          <Button
            onClick={handleNext}
            className="flex-1"
            style={primaryBg}
          >
            {tCommon("next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
            style={primaryBg}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Crown className="h-4 w-4 mr-2" />
            )}
            {tUpgrade("submitRequest")}
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
            <Crown className="h-5 w-5" style={primaryText || { color: 'hsl(var(--primary))' }} />
            {t("upgradePlan")}
          </DialogTitle>
          <DialogDescription>
            {!submitted && (
              <span className="flex items-center gap-2 mt-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i + 1 > getProgressStep() && "bg-muted"
                    )}
                    style={i + 1 <= getProgressStep() ? (primaryBg || { backgroundColor: 'hsl(var(--primary))' }) : undefined}
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
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        {renderNavigation()}
      </DialogContent>
    </Dialog>
  );
}
