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
import { DEFAULT_PRICING } from "@/lib/constants/pricing";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentTier?: string | null;
  hasChatbot?: boolean; // Does user already have chatbot addon?
  primaryColor?: string | null;
  currentCompanyCount?: number; // Number of companies user currently has
  defaultSelectedPlan?: "PRO" | "BUSINESS"; // Pre-select a plan when opening
}

interface Pricing {
  PRO_BASE: number;
  CHATBOT_ADDON: number;
  EXTRA_COMPANY: number;
  BUSINESS_BASE: number;
}

type PlanTier = "PRO" | "BUSINESS";

// Type for what PRO users can upgrade to
type ProUpgradeChoice = "chatbot" | "companies" | "business";

export function UpgradeModal({
  open,
  onOpenChange,
  onSuccess,
  currentTier,
  hasChatbot = false,
  primaryColor,
  currentCompanyCount,
  defaultSelectedPlan,
}: UpgradeModalProps) {
  const t = useTranslations("pricing");
  const tUpgrade = useTranslations("upgrade");
  const tCommon = useTranslations("common");

  // Check if user already has PRO plan (addon-only mode)
  const isProAddonMode = currentTier === "PRO";
  // PRO users who have chatbot already can only add companies or upgrade to business
  const canAddChatbot = isProAddonMode && !hasChatbot;
  const proHasChatbotAlready = isProAddonMode && hasChatbot;

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("PRO");
  // For PRO users: what upgrade path they chose
  const [proUpgradeChoice, setProUpgradeChoice] = useState<ProUpgradeChoice | null>(null);
  const [includeChatbot, setIncludeChatbot] = useState(false);
  const [extraCompanyCount, setExtraCompanyCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [copied, setCopied] = useState(false);
  const [pricing, setPricing] = useState<Pricing>({
    PRO_BASE: DEFAULT_PRICING.PRO_BASE,
    CHATBOT_ADDON: DEFAULT_PRICING.CHATBOT_ADDON,
    EXTRA_COMPANY: DEFAULT_PRICING.EXTRA_COMPANY,
    BUSINESS_BASE: DEFAULT_PRICING.BUSINESS_BASE,
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
      // PRO users start at step 1 to choose their upgrade path
      // Non-PRO users also start at step 1 to choose PRO vs Business
      setStep(1);
      setSelectedPlan(defaultSelectedPlan || "PRO");
      setProUpgradeChoice(null);
      setIncludeChatbot(false);

      // Pre-fill extra companies:
      // - For PRO users: they already have their slots, start at 0 (only buy NEW extra slots)
      // - For trial users: pre-fill based on current companies to keep all existing
      if (currentTier === "PRO") {
        // PRO users already have their slots, don't pre-fill
        setExtraCompanyCount(0);
      } else {
        // Trial users: calculate how many extra slots they need
        // Pro includes 1 company, so extra = max(0, currentCount - 1)
        const requiredExtra = Math.max(0, (currentCompanyCount ?? 1) - 1);
        setExtraCompanyCount(requiredExtra);
      }

      setIsSubmitting(false);
      setSubmitted(false);
      setPaymentReference("");
    }
  }, [open, currentCompanyCount, currentTier, defaultSelectedPlan]);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  // Calculate total price based on selected plan
  const calculateTotalPrice = () => {
    // For Business plan (or PRO users upgrading to Business)
    if (selectedPlan === "BUSINESS" || proUpgradeChoice === "business") {
      return pricing.BUSINESS_BASE;
    }
    // If user already has PRO, don't charge base price again
    const basePrice = isProAddonMode ? 0 : pricing.PRO_BASE;
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
      // Determine actual plan tier (Business upgrade from PRO user)
      const actualPlanTier = proUpgradeChoice === "business" ? "BUSINESS" : selectedPlan;
      const isBusiness = actualPlanTier === "BUSINESS";

      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: actualPlanTier,
          includeChatbot: isBusiness ? true : includeChatbot,
          extraCompanyCount: isBusiness ? 0 : extraCompanyCount,
          isAddonOnly: isProAddonMode, // User already has PRO, just adding addons
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

  // Get total steps based on plan and mode
  const getTotalSteps = () => {
    // Business from trial/new user: Plan -> Summary -> Confirm = 3 steps
    if (selectedPlan === "BUSINESS" && !isProAddonMode) return 3;

    // PRO user choosing Business: Choose -> Summary -> Confirm = 3 steps
    if (isProAddonMode && proUpgradeChoice === "business") return 3;

    // PRO user with chatbot choosing companies: Choose -> Companies -> Summary -> Confirm = 4 steps
    if (proHasChatbotAlready && proUpgradeChoice === "companies") return 4;

    // PRO user without chatbot choosing chatbot: Choose -> Chatbot (pre-selected) -> Companies -> Summary -> Confirm = 4 steps
    // (Chatbot is pre-selected, so effectively: Choose -> Companies -> Summary -> Confirm = 4 steps)
    if (isProAddonMode && proUpgradeChoice === "chatbot") return 4;

    // Non-PRO PRO plan: Plan -> Companies -> Chatbot -> Summary -> Confirm = 5 steps
    return 5;
  };
  const totalSteps = getTotalSteps();

  // Get actual step for progress bar
  const getProgressStep = () => {
    // Business from trial/new user
    if (selectedPlan === "BUSINESS" && !isProAddonMode) {
      if (step === 1) return 1;
      if (step === 4) return 2;
      if (step === 5) return 3;
    }

    // PRO user flows
    if (isProAddonMode) {
      // Business upgrade
      if (proUpgradeChoice === "business") {
        if (step === 1) return 1;
        if (step === 4) return 2;
        if (step === 5) return 3;
      }
      // Companies only (PRO with chatbot)
      if (proHasChatbotAlready && proUpgradeChoice === "companies") {
        if (step === 1) return 1;
        if (step === 2) return 2;
        if (step === 4) return 3;
        if (step === 5) return 4;
      }
      // Chatbot + optional companies (PRO without chatbot)
      if (proUpgradeChoice === "chatbot") {
        if (step === 1) return 1;
        if (step === 2) return 2; // Companies step (chatbot pre-selected)
        if (step === 4) return 3;
        if (step === 5) return 4;
      }
      // Still at choose step
      return 1;
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

  // Step 1 for PRO users: Choose upgrade path (Chatbot vs Business, or Companies vs Business)
  const renderProAddonStep1 = () => {
    // PRO user with chatbot already: can add companies or upgrade to business
    // PRO user without chatbot: can add chatbot (+companies) or upgrade to business
    const showChatbotOption = canAddChatbot;
    const showCompaniesOption = proHasChatbotAlready;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
          >
            <Crown className="h-6 w-6" style={primaryText || { color: 'hsl(var(--primary))' }} />
          </div>
          <h3 className="font-semibold text-lg mb-1">{tUpgrade("chooseUpgradeType")}</h3>
          <p className="text-sm text-muted-foreground">
            {tUpgrade("chooseUpgradeTypeDescription")}
          </p>
        </div>

        <div className="space-y-3">
          {/* Add Chatbot Option (for PRO users without chatbot) */}
          {showChatbotOption && (
            <div
              onClick={() => {
                setProUpgradeChoice("chatbot");
                setIncludeChatbot(true); // Pre-select chatbot
              }}
              className={cn(
                "relative p-4 rounded-xl border bg-card cursor-pointer transition-all",
                proUpgradeChoice === "chatbot" ? "ring-2" : "hover:border-muted-foreground/50"
              )}
              style={proUpgradeChoice === "chatbot" ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  style={proUpgradeChoice === "chatbot" ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
                >
                  {proUpgradeChoice === "chatbot" && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" style={primaryText || { color: 'hsl(var(--primary))' }} />
                      <span className="font-semibold">{tUpgrade("addChatbotAddon")}</span>
                    </div>
                    <span className="font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
                      +{formatPrice(pricing.CHATBOT_ADDON)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tUpgrade("addChatbotDescription")}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                      <span>{tUpgrade("chatbotFeature1")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4" style={primaryText || { color: 'hsl(var(--primary))' }} />
                      <span>{tUpgrade("chatbotFeature2")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Companies Option (for PRO users with chatbot) */}
          {showCompaniesOption && (
            <div
              onClick={() => setProUpgradeChoice("companies")}
              className={cn(
                "relative p-4 rounded-xl border bg-card cursor-pointer transition-all",
                proUpgradeChoice === "companies" ? "ring-2" : "hover:border-muted-foreground/50"
              )}
              style={proUpgradeChoice === "companies" ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  style={proUpgradeChoice === "companies" ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
                >
                  {proUpgradeChoice === "companies" && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" style={primaryText || { color: 'hsl(var(--primary))' }} />
                      <span className="font-semibold">{tUpgrade("addCompanies")}</span>
                    </div>
                    <span className="font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
                      {formatPrice(pricing.EXTRA_COMPANY)}<span className="text-sm font-normal text-muted-foreground">/ea</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tUpgrade("addCompaniesDescription")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade to Business Option (always shown for PRO users) */}
          <div
            onClick={() => setProUpgradeChoice("business")}
            className={cn(
              "relative p-4 rounded-xl border bg-card cursor-pointer transition-all",
              proUpgradeChoice === "business" ? "ring-2" : "hover:border-muted-foreground/50"
            )}
            style={proUpgradeChoice === "business" ? { borderColor: primaryColor || 'hsl(var(--primary))', boxShadow: primaryColor ? `0 0 0 1px ${primaryColor}` : undefined } : undefined}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                style={proUpgradeChoice === "business" ? { borderColor: primaryColor || 'hsl(var(--primary))' } : { borderColor: 'hsl(var(--muted-foreground))' }}
              >
                {proUpgradeChoice === "business" && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={primaryBg || { backgroundColor: 'hsl(var(--primary))' }}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tUpgrade("upgradeToBusiness")}</span>
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="font-bold" style={primaryText || { color: 'hsl(var(--primary))' }}>
                    {formatPrice(pricing.BUSINESS_BASE)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{tUpgrade("upgradeToBusinessDescription")}</p>
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
  };

  // Step 1: Plan selection (Pro vs Business) - for new/trial users
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
  const renderStep4 = () => {
    // Check if this is a Business upgrade (either direct selection or PRO user upgrading)
    const isBusinessUpgrade = selectedPlan === "BUSINESS" || proUpgradeChoice === "business";
    // PRO user adding addons (not upgrading to business)
    const isProAddons = isProAddonMode && proUpgradeChoice !== "business";

    return (
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
          {isProAddons ? tUpgrade("addons") : isBusinessUpgrade ? `Business ${tUpgrade("plan")}` : `Pro ${tUpgrade("plan")}`}
        </h4>
        <div className="space-y-3">
          {/* Show base price only if not in addon mode (new user getting PRO or Business) */}
          {!isProAddonMode && (
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
          )}

          {/* PRO user upgrading to Business */}
          {isProAddonMode && proUpgradeChoice === "business" && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-muted-foreground">{tUpgrade("existingProPlan")}</span>
                </div>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(pricing.PRO_BASE)}/mo</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={primaryBgLight || { backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="font-medium">{tUpgrade("upgradeToBusiness")}</span>
                </div>
                <span className="font-medium">{formatPrice(pricing.BUSINESS_BASE)}/mo</span>
              </div>
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
            </>
          )}

          {/* Show existing Pro subscription note in addon mode (not business) */}
          {isProAddons && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-muted-foreground">{tUpgrade("existingProPlan")}</span>
              </div>
              <span className="text-sm text-muted-foreground">{tUpgrade("alreadyActive")}</span>
            </div>
          )}

          {/* Chatbot addon (PRO users adding chatbot, or new PRO users with chatbot) */}
          {selectedPlan === "PRO" && includeChatbot && proUpgradeChoice !== "business" && (
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

          {/* Extra companies (PRO users adding companies, or new PRO users with extra companies) */}
          {selectedPlan === "PRO" && extraCompanyCount > 0 && proUpgradeChoice !== "business" && (
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

          {/* New user selecting Business */}
          {selectedPlan === "BUSINESS" && !isProAddonMode && (
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
  };

  // Step 5: Confirmation
  const renderStep5 = () => {
    // Check if this is a Business upgrade (either direct selection or PRO user upgrading)
    const isBusinessUpgrade = selectedPlan === "BUSINESS" || proUpgradeChoice === "business";

    return (
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
            <span className="font-medium">{isBusinessUpgrade ? "Business" : "Pro"}</span>
          </div>
          {!isBusinessUpgrade && (
            <>
              {isProAddonMode ? (
                // PRO addon mode: show extra companies being purchased (not total)
                extraCompanyCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tUpgrade("extraCompanies")}</span>
                    <span className="font-medium">+{extraCompanyCount}</span>
                  </div>
                )
              ) : (
                // New PRO subscription: show total companies
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tUpgrade("totalCompanies")}</span>
                  <span className="font-medium">{1 + extraCompanyCount}</span>
                </div>
              )}
              {!hasChatbot && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tUpgrade("aiChatbot")}</span>
                  <span className="font-medium">
                    {isProAddonMode
                      ? (includeChatbot || proUpgradeChoice === "chatbot" ? tCommon("yes") : tCommon("no"))
                      : (includeChatbot ? tCommon("yes") : tCommon("no"))
                    }
                  </span>
                </div>
              )}
            </>
          )}
          {isBusinessUpgrade && (
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
  };

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
    // Non-PRO user selecting Business: Plan (1) -> Summary (4) -> Confirm (5)
    if (selectedPlan === "BUSINESS" && !isProAddonMode) {
      if (step === 1) setStep(4);
      else if (step === 4) setStep(5);
      return;
    }

    // PRO user flows
    if (isProAddonMode) {
      // Business upgrade: Choose (1) -> Summary (4) -> Confirm (5)
      if (proUpgradeChoice === "business") {
        if (step === 1) setStep(4);
        else if (step === 4) setStep(5);
        return;
      }
      // Chatbot + companies: Choose (1) -> Companies (2) -> Summary (4) -> Confirm (5)
      if (proUpgradeChoice === "chatbot") {
        if (step === 1) setStep(2);
        else if (step === 2) setStep(4);
        else if (step === 4) setStep(5);
        return;
      }
      // Companies only (has chatbot): Choose (1) -> Companies (2) -> Summary (4) -> Confirm (5)
      if (proUpgradeChoice === "companies") {
        if (step === 1) setStep(2);
        else if (step === 2) setStep(4);
        else if (step === 4) setStep(5);
        return;
      }
    }

    // Non-PRO user selecting PRO: Plan (1) -> Companies (2) -> Chatbot (3) -> Summary (4) -> Confirm (5)
    setStep(step + 1);
  };

  const handleBack = () => {
    // Non-PRO user selecting Business
    if (selectedPlan === "BUSINESS" && !isProAddonMode) {
      if (step === 4) setStep(1);
      else if (step === 5) setStep(4);
      return;
    }

    // PRO user flows
    if (isProAddonMode) {
      // Business upgrade
      if (proUpgradeChoice === "business") {
        if (step === 4) setStep(1);
        else if (step === 5) setStep(4);
        return;
      }
      // Chatbot + companies or companies only
      if (proUpgradeChoice === "chatbot" || proUpgradeChoice === "companies") {
        if (step === 2) setStep(1);
        else if (step === 4) setStep(2);
        else if (step === 5) setStep(4);
        return;
      }
    }

    // Non-PRO user selecting PRO
    setStep(step - 1);
  };

  const isLastStep = () => {
    return step === 5;
  };

  const isFirstStep = () => {
    return step === 1;
  };

  // Check if next button should be disabled (must select an option in PRO addon mode step 1)
  const isNextDisabled = () => {
    if (isProAddonMode && step === 1 && !proUpgradeChoice) {
      return true;
    }
    return false;
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
        {!isFirstStep() && (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon("back")}
          </Button>
        )}
        {!isLastStep() ? (
          <Button
            onClick={handleNext}
            disabled={isNextDisabled()}
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
          {step === 1 && (isProAddonMode ? renderProAddonStep1() : renderStep1())}
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
