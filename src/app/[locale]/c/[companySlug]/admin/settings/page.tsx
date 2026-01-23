"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, Check, Building2, Palette, Bot, MessageSquare, FileText, Camera, X, ImageIcon, Code, Copy, CreditCard, Crown, Clock, AlertTriangle, ExternalLink, Calendar, Plus, Briefcase } from "lucide-react";
import { Link } from "@/i18n/routing";
import { UsageMeter } from "@/components/subscription/usage-meter";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { CreateCompanyModal } from "@/components/admin/create-company-modal";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOT_PERSONALITIES, type PersonalityKey } from "@/lib/ai/personalities";
import { cn } from "@/lib/utils";
import { generateThemePalette } from "@/lib/utils/colors";

// Color presets for brand color
const colorPresets = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
];

interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  headerDisplayMode: string;
  primaryColor: string;
  timezone: string;
  currency: string;
  aiApiKey: string | null;
  hasAiApiKey: boolean;
  aiEndpoint: string | null;
  aiModel: string | null;
  aiSystemPrompt: string | null;
  aiBotName: string | null;
  aiGreeting: string | null;
  aiPersonality: string | null;
  // Business Details
  businessAddress: string | null;
  taxId: string | null;
  vatNumber: string | null;
  bankAccount: string | null;
  bankName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  notificationEmails: string[];
  taxRate: number;
}

type SettingsTab = "general" | "branding" | "ai" | "bot" | "business" | "embed" | "subscription";

const tabConfig: { id: SettingsTab; labelKey: string; icon: typeof Building2 }[] = [
  { id: "general", labelKey: "tabGeneral", icon: Building2 },
  { id: "business", labelKey: "tabBusinessDetails", icon: FileText },
  { id: "branding", labelKey: "tabBranding", icon: Palette },
  { id: "ai", labelKey: "tabAiChatbot", icon: Bot },
  { id: "bot", labelKey: "tabBotPersonality", icon: MessageSquare },
  { id: "embed", labelKey: "tabEmbed", icon: Code },
  { id: "subscription", labelKey: "tabSubscription", icon: CreditCard },
];

interface SubscriptionData {
  status: string;
  planTier: string;
  planName: string;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  extraCompanySlots: number;
  daysRemaining: number;
  chatUsage: {
    used: number;
    limit: number;
    unlimited: boolean;
    resetsAt: string;
  };
  documentUsage: {
    current: number;
    limit: number;
    unlimited: boolean;
  };
  companySlots: {
    used: number;
    total: number;
    unlimited: boolean;
    available: number;
  };
  features: {
    customBranding: boolean;
    prioritySupport: boolean;
    aiChatbot: boolean;
  };
  plan: {
    maxDocumentsPerCompany: number | null;
    extraCompanyPrice: number | null;
    chatbotAddonPrice: number; // EUR cents
  };
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    serviceCount: number;
  }>;
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tSub = useTranslations("subscription");
  const tUpgrade = useTranslations("upgrade");

  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [pendingUpgradeRequest, setPendingUpgradeRequest] = useState<{
    id: string;
    includeChatbot: boolean;
    extraCompanyCount: number;
    totalMonthlyPrice: number;
    createdAt: string;
  } | null>(null);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [headerDisplayMode, setHeaderDisplayMode] = useState("both");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [timezone, setTimezone] = useState("Europe/Belgrade");
  const [currency, setCurrency] = useState("RSD");
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasExistingApiKey, setHasExistingApiKey] = useState(false);
  const [aiEndpoint, setAiEndpoint] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");
  const [aiBotName, setAiBotName] = useState("");
  const [aiGreeting, setAiGreeting] = useState("");
  const [aiPersonality, setAiPersonality] = useState<string>("friendly");

  // Business Details state
  const [businessAddress, setBusinessAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newNotificationEmail, setNewNotificationEmail] = useState("");
  const [taxRate, setTaxRate] = useState<number>(20);

  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageType"));
      return;
    }

    // Max 500KB for logos to avoid storage issues
    if (file.size > 500 * 1024) {
      toast.error(t("logoTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setLogoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoUrl("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Read hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && tabConfig.some(tab => tab.id === hash)) {
      setActiveTab(hash as SettingsTab);
    }
  }, []);

  // Apply primary color changes in real-time
  useEffect(() => {
    if (primaryColor) {
      const palette = generateThemePalette(primaryColor);
      // Find the company layout wrapper that has the CSS variables
      const wrapper = document.querySelector('[data-theme-wrapper]') as HTMLElement;
      if (wrapper) {
        wrapper.style.setProperty("--company-primary", primaryColor);
        wrapper.style.setProperty("--primary", palette.primary);
        wrapper.style.setProperty("--primary-foreground", palette.foreground);
        wrapper.style.setProperty("--ring", palette.ring);
      }
      // Dispatch event for components outside the wrapper (like dropdown portals)
      window.dispatchEvent(new CustomEvent("company-color-change", { detail: { color: primaryColor } }));
    }
  }, [primaryColor]);

  // Update hash on tab change
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    loadSettings();
  }, [companySlug]);

  // Load subscription data on mount to check chatbot access for tabs
  useEffect(() => {
    if (!subscriptionData && !isLoadingSubscription) {
      loadSubscriptionData();
    }
  }, []);

  // Load pending upgrade request when subscription tab is active
  useEffect(() => {
    if (activeTab === "subscription") {
      loadPendingUpgradeRequest();
    }
  }, [activeTab]);

  // Check if chatbot is available
  const hasChatbotAccess = subscriptionData?.features?.aiChatbot ?? false;

  async function loadSubscriptionData() {
    setIsLoadingSubscription(true);
    try {
      const response = await fetch(`/api/c/${companySlug}/settings/subscription`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setIsLoadingSubscription(false);
    }
  }

  async function loadPendingUpgradeRequest() {
    try {
      const response = await fetch("/api/subscription/upgrade");
      if (response.ok) {
        const data = await response.json();
        if (data.hasPendingRequest && data.request) {
          setPendingUpgradeRequest(data.request);
        } else {
          setPendingUpgradeRequest(null);
        }
      }
    } catch (error) {
      console.error("Error loading pending upgrade request:", error);
    }
  }

  async function handleCancelUpgradeRequest() {
    if (!pendingUpgradeRequest) return;

    setIsCancellingRequest(true);
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel upgrade request");
      }

      setPendingUpgradeRequest(null);
      toast.success(tUpgrade("requestCancelled"));
    } catch (error) {
      console.error("Error cancelling upgrade request:", error);
      toast.error(tCommon("error"));
    } finally {
      setIsCancellingRequest(false);
    }
  }

  async function loadSettings() {
    try {
      const response = await fetch(`/api/c/${companySlug}/settings`);

      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const settings: CompanySettings = await response.json();

      setName(settings.name);
      setDescription(settings.description || "");
      setLogoUrl(settings.logoUrl || "");
      setHeaderDisplayMode(settings.headerDisplayMode || "both");
      setPrimaryColor(settings.primaryColor || "#3B82F6");
      setTimezone(settings.timezone || "Europe/Belgrade");
      setCurrency(settings.currency || "RSD");
      setAiApiKey(settings.aiApiKey || "");
      setHasExistingApiKey(settings.hasAiApiKey);
      setAiEndpoint(settings.aiEndpoint || "");
      setAiModel(settings.aiModel || "");
      setAiSystemPrompt(settings.aiSystemPrompt || "");
      setAiBotName(settings.aiBotName || "");
      setAiGreeting(settings.aiGreeting || "");
      setAiPersonality(settings.aiPersonality || "friendly");
      // Business Details
      setBusinessAddress(settings.businessAddress || "");
      setTaxId(settings.taxId || "");
      setVatNumber(settings.vatNumber || "");
      setBankAccount(settings.bankAccount || "");
      setBankName(settings.bankName || "");
      setBusinessPhone(settings.businessPhone || "");
      setBusinessEmail(settings.businessEmail || "");
      setNotificationEmails(settings.notificationEmails || []);
      setTaxRate(settings.taxRate ?? 20);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        name,
        description: description || null,
        logoUrl: logoUrl || null,
        headerDisplayMode,
        primaryColor,
        timezone,
        currency,
        aiEndpoint: aiEndpoint || null,
        aiModel: aiModel || null,
        aiSystemPrompt: aiSystemPrompt || null,
        aiBotName: aiBotName || null,
        aiGreeting: aiGreeting || null,
        aiPersonality: aiPersonality || null,
        // Business Details
        businessAddress: businessAddress || null,
        taxId: taxId || null,
        vatNumber: vatNumber || null,
        bankAccount: bankAccount || null,
        bankName: bankName || null,
        businessPhone: businessPhone || null,
        businessEmail: businessEmail || null,
        notificationEmails,
        taxRate,
      };

      // Only include API key if it's been changed (not masked)
      if (aiApiKey && !aiApiKey.startsWith("***")) {
        updateData.aiApiKey = aiApiKey || null;
      }

      const response = await fetch(`/api/c/${companySlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to save settings");
      }

      const updatedSettings: CompanySettings = await response.json();

      // Update form with returned values
      setAiApiKey(updatedSettings.aiApiKey || "");
      setHasExistingApiKey(updatedSettings.hasAiApiKey);

      // Refresh the page to update header/layout with new settings
      router.refresh();

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Section Components
  const GeneralSection = () => (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {t("generalInfo")}
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">{t("companyName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium">{t("timezone")}</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium">{t("currency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RSD">RSD - Serbian Dinar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("currencyHint")}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">{t("description")}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  const BrandingSection = () => {
    const displayLogo = logoPreview || logoUrl;
    const canUseBranding = subscriptionData?.features.customBranding ?? false;

    // Load subscription data if not loaded yet
    useEffect(() => {
      if (!subscriptionData && !isLoadingSubscription) {
        loadSubscriptionData();
      }
    }, []);

    if (isLoadingSubscription) {
      return (
        <div className="rounded-xl border bg-card p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Show upgrade prompt if custom branding is not available
    if (!canUseBranding) {
      return (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t("branding")}
          </h3>
          <div className="relative">
            {/* Blurred preview of branding section */}
            <div className="blur-sm pointer-events-none opacity-50 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("companyLogo")}</Label>
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("primaryColor")}</Label>
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-10 bg-primary rounded" />
                </div>
              </div>
            </div>
            {/* Upgrade overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="text-center p-6">
                <Palette className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-semibold mb-2">{tSub("customBrandingLocked")}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {tSub("upgradeToCustomize")}
                </p>
                <Link href="/pricing">
                  <Button size="sm">
                    <Crown className="h-4 w-4 mr-2" />
                    {tSub("upgradeToPro")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {t("branding")}
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("companyLogo")}</Label>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div
                onClick={handleLogoClick}
                className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/50"
              >
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt="Company logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              {displayLogo && (
                <button
                  onClick={handleLogoClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleLogoClick}>
                  {t("uploadLogo")}
                </Button>
                {displayLogo && (
                  <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                    <X className="h-4 w-4 mr-1" />
                    {t("removeLogo")}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("logoHint")}
              </p>
            </div>
          </div>
        </div>
        {displayLogo && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("headerDisplay")}</Label>
            <Select value={headerDisplayMode} onValueChange={setHeaderDisplayMode}>
              <SelectTrigger className="w-full md:w-64 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">{t("headerDisplayBoth")}</SelectItem>
                <SelectItem value="logo">{t("headerDisplayLogo")}</SelectItem>
                <SelectItem value="name">{t("headerDisplayName")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("headerDisplayHint")}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="color" className="text-sm font-medium">{t("primaryColor")}</Label>
          <div className="flex gap-3 items-center flex-wrap">
            <Input
              id="color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-28 h-10"
            />
            <div className="flex gap-1.5">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setPrimaryColor(preset.value)}
                  className="relative h-8 w-8 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {primaryColor.toUpperCase() === preset.value.toUpperCase() && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("brandColorHint")}
          </p>
        </div>
      </div>
    </div>
  );
  };

  const AiChatbotSection = () => (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {t("aiChatbot")}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {t("aiChatbotDescription")}
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aiApiKey" className="text-sm font-medium">{t("aiApiKey")}</Label>
            <div className="flex gap-2">
              <Input
                id="aiApiKey"
                type={showApiKey ? "text" : "password"}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={hasExistingApiKey ? t("enterNewKeyToReplace") : "sk-..."}
                className="h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {hasExistingApiKey && aiApiKey?.startsWith("***") && (
              <p className="text-xs text-muted-foreground">
                {t("apiKeyConfigured")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiModel" className="text-sm font-medium">{t("aiModel")}</Label>
            <Input
              id="aiModel"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="gpt-3.5-turbo"
              className="h-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aiEndpoint" className="text-sm font-medium">{t("aiEndpoint")}</Label>
          <Input
            id="aiEndpoint"
            value={aiEndpoint}
            onChange={(e) => setAiEndpoint(e.target.value)}
            placeholder="https://api.openai.com/v1 (leave empty for default)"
            className="h-10"
          />
        </div>
      </div>
    </div>
  );

  const BotPersonalitySection = () => (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {t("botPersonality")}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {t("botPersonalityDescription")}
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aiBotName" className="text-sm font-medium">{t("aiBotName")}</Label>
            <Input
              id="aiBotName"
              value={aiBotName}
              onChange={(e) => setAiBotName(e.target.value)}
              placeholder="Assistant"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              {t("aiBotNameDescription")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiPersonality" className="text-sm font-medium">{t("aiPersonalityLabel")}</Label>
            <Select value={aiPersonality} onValueChange={setAiPersonality}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a personality" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BOT_PERSONALITIES) as PersonalityKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {BOT_PERSONALITIES[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {BOT_PERSONALITIES[aiPersonality as PersonalityKey]?.description || BOT_PERSONALITIES.friendly.description}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aiGreeting" className="text-sm font-medium">{t("aiGreeting")}</Label>
          <Input
            id="aiGreeting"
            value={aiGreeting}
            onChange={(e) => setAiGreeting(e.target.value)}
            placeholder="Hello! How can I help you today?"
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            {t("aiGreetingDescription")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aiSystemPrompt" className="text-sm font-medium">{t("aiSystemPrompt")}</Label>
          <Textarea
            id="aiSystemPrompt"
            value={aiSystemPrompt}
            onChange={(e) => setAiSystemPrompt(e.target.value)}
            placeholder="Custom instructions for the AI assistant..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const BusinessDetailsSection = () => {
    const handleAddNotificationEmail = () => {
      const email = newNotificationEmail.trim().toLowerCase();
      if (!email) return;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error(t("invalidEmail"));
        return;
      }

      // Check for duplicates
      if (notificationEmails.includes(email)) {
        toast.error(t("emailAlreadyAdded"));
        return;
      }

      setNotificationEmails([...notificationEmails, email]);
      setNewNotificationEmail("");
    };

    const handleRemoveNotificationEmail = (email: string) => {
      setNotificationEmails(notificationEmails.filter((e) => e !== email));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddNotificationEmail();
      }
    };

    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("businessDetails")}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t("businessDetailsDescription")}
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessAddress" className="text-sm font-medium">{t("businessAddress")}</Label>
              <Textarea
                id="businessAddress"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="123 Business St, City, Country"
                rows={2}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxId" className="text-sm font-medium">{t("taxId")}</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="123456789"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber" className="text-sm font-medium">{t("vatNumber")}</Label>
                <Input
                  id="vatNumber"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="RS123456789"
                  className="h-10"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-sm font-medium">{t("bankName")}</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount" className="text-sm font-medium">{t("bankAccount")}</Label>
              <Input
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="123-4567890123456-78"
                className="h-10"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessPhone" className="text-sm font-medium">{t("businessPhone")}</Label>
              <Input
                id="businessPhone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="+381 11 123 4567"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail" className="text-sm font-medium">{t("businessEmail")}</Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="billing@company.com"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-sm font-medium">{t("taxRate")}</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                placeholder="20"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                {t("taxRateHint")}
              </p>
            </div>
          </div>

          {/* Notification Emails Section */}
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("notificationEmails")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("notificationEmailsDescription")}
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newNotificationEmail}
                  onChange={(e) => setNewNotificationEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="admin@company.com"
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNotificationEmail}
                  className="h-10 px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {notificationEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {notificationEmails.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveNotificationEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EmbedSection = () => {
    const [copied, setCopied] = useState(false);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const embedUrl = `${baseUrl}/${locale}/embed/${companySlug}`;

    const embedCode = `<iframe
  src="${embedUrl}"
  width="400"
  height="600"
  frameborder="0"
  style="position:fixed;bottom:0;right:0;border:none;z-index:9999;"
  allow="clipboard-write"
></iframe>`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(embedCode);
        setCopied(true);
        toast.success(t("embedCodeCopied"));
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error(tCommon("error"));
      }
    };

    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("embedChatbot")}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t("embedDescription")}
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("embedCode")}</Label>
            <div className="relative">
              <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 text-xs overflow-x-auto font-mono">
                {embedCode}
              </pre>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="absolute top-2 right-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {t("copy")}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("embedInstructions")}</Label>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>1. {t("embedStep1")}</p>
              <p>2. {t("embedStep2")}</p>
              <p>3. {t("embedStep3")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("embedPreview")}</Label>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {t("embedDimensions")}: <span className="font-mono">400 × 600px</span>
                </div>
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {t("openInNewTab")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SubscriptionSection = () => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    };

    const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

    if (isLoadingSubscription) {
      return (
        <div className="rounded-xl border bg-card p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Pending Upgrade Request Banner
    const PendingUpgradeBanner = () => {
      if (!pendingUpgradeRequest) return null;

      return (
        <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                {tUpgrade("pendingPayment")}
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {tUpgrade("pendingPaymentDescription")}
              </p>
              <div className="mt-3 text-sm space-y-1">
                <div className="flex gap-4">
                  <span className="text-yellow-600 dark:text-yellow-400">{tUpgrade("plan")}:</span>
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">Pro</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-yellow-600 dark:text-yellow-400">{tUpgrade("aiChatbot")}:</span>
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    {pendingUpgradeRequest.includeChatbot ? tCommon("yes") : tCommon("no")}
                  </span>
                </div>
                {pendingUpgradeRequest.extraCompanyCount > 0 && (
                  <div className="flex gap-4">
                    <span className="text-yellow-600 dark:text-yellow-400">{tUpgrade("extraCompanies")}:</span>
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      {pendingUpgradeRequest.extraCompanyCount}
                    </span>
                  </div>
                )}
                <div className="flex gap-4">
                  <span className="text-yellow-600 dark:text-yellow-400">{tUpgrade("totalMonthly")}:</span>
                  <span className="font-bold text-yellow-800 dark:text-yellow-200">
                    {formatPrice(pendingUpgradeRequest.totalMonthlyPrice)}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-yellow-600 dark:text-yellow-400">{tUpgrade("createdOn")}:</span>
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    {formatDate(pendingUpgradeRequest.createdAt)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                onClick={handleCancelUpgradeRequest}
                disabled={isCancellingRequest}
              >
                {isCancellingRequest && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {tUpgrade("cancelRequest")}
              </Button>
            </div>
          </div>
        </div>
      );
    };

    if (!subscriptionData) {
      return (
        <div className="rounded-xl border bg-card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{tSub("noSubscription")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tSub("noSubscriptionDescription")}</p>
          <Link href="/pricing">
            <Button>
              <Crown className="h-4 w-4 mr-2" />
              {tSub("viewPricing")}
            </Button>
          </Link>
        </div>
      );
    }

    const statusColors: Record<string, { text: string; bg: string; usePrimaryColor?: boolean }> = {
      ACTIVE: { text: "", bg: "", usePrimaryColor: true },
      TRIALING: { text: "text-primary", bg: "bg-primary/10" },
      TRIAL_EXPIRED: { text: "text-destructive", bg: "bg-red-100" },
      PAST_DUE: { text: "text-amber-600", bg: "bg-amber-100" },
      CANCELLED: { text: "text-muted-foreground", bg: "bg-muted" },
    };

    const colors = statusColors[subscriptionData.status] || statusColors.CANCELLED;
    const usePrimaryColor = colors.usePrimaryColor;

    return (
      <div className="space-y-4">
        {/* Pending Upgrade Banner */}
        <PendingUpgradeBanner />

        {/* Current Plan */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {tSub("currentPlan")}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn("flex h-10 w-10 items-center justify-center rounded-full", !usePrimaryColor && colors.bg)}
                style={usePrimaryColor ? { backgroundColor: `${primaryColor}15` } : undefined}
              >
                <CreditCard
                  className={cn("h-5 w-5", !usePrimaryColor && colors.text)}
                  style={usePrimaryColor ? { color: primaryColor } : undefined}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{subscriptionData.planName}</span>
                  <Badge
                    variant="outline"
                    className={!usePrimaryColor ? colors.text : undefined}
                    style={usePrimaryColor ? { color: primaryColor, borderColor: `${primaryColor}40` } : undefined}
                  >
                    {subscriptionData.status === "TRIALING" && <Clock className="h-3 w-3 mr-1" />}
                    {subscriptionData.status === "ACTIVE" && <Check className="h-3 w-3 mr-1" />}
                    {(subscriptionData.status === "TRIAL_EXPIRED" || subscriptionData.status === "PAST_DUE") && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {tSub(`status_${subscriptionData.status}`)}
                  </Badge>
                </div>
              </div>
            </div>
            {subscriptionData.planTier !== "BUSINESS" && !pendingUpgradeRequest && (
              <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                <Crown className="h-4 w-4 mr-2" />
                {tSub("upgradePlan")}
              </Button>
            )}
          </div>
          {/* Trial Period Info */}
          {subscriptionData.status === "TRIALING" && subscriptionData.trialEndsAt && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{tSub("trialPeriod")}:</span>
                <span className="font-medium">
                  {formatDate(subscriptionData.currentPeriodStart)} - {formatDate(subscriptionData.trialEndsAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {tSub("trialDaysRemaining", { days: subscriptionData.daysRemaining })} - {tSub("trialFreeDescription")}
              </p>
            </div>
          )}
          {/* Billing Period - only show for paid subscriptions */}
          {subscriptionData.status !== "TRIALING" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t">
              <Calendar className="h-4 w-4" />
              <span>
                {tSub("billingPeriod")}: {formatDate(subscriptionData.currentPeriodStart)} - {formatDate(subscriptionData.currentPeriodEnd)}
              </span>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {tSub("usage")}
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Chat Messages & Knowledge Base - Combined when no chatbot */}
            {subscriptionData.features.aiChatbot ? (
              <>
                {/* Chat Messages */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: primaryColor }} />
                    <span className="font-medium">{tSub("chatMessages")}</span>
                  </div>
                  <UsageMeter
                    label=""
                    used={subscriptionData.chatUsage.used}
                    limit={subscriptionData.chatUsage.limit}
                    unlimited={subscriptionData.chatUsage.unlimited}
                    showPercentage={true}
                    color={primaryColor}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tSub("resetsOn", { date: formatDate(subscriptionData.chatUsage.resetsAt) })}
                  </p>
                </div>

                {/* Knowledge Base (Documents) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: primaryColor }} />
                    <span className="font-medium">{tSub("knowledgeBase")}</span>
                  </div>
                  <UsageMeter
                    label=""
                    used={subscriptionData.documentUsage.current}
                    limit={subscriptionData.documentUsage.limit}
                    unlimited={subscriptionData.documentUsage.unlimited}
                    showPercentage={true}
                    color={primaryColor}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tSub("documentsThisCompany")}
                  </p>
                </div>
              </>
            ) : (
              /* Combined AI Chatbot features - not available */
              <div
                className="col-span-2 space-y-3 rounded-lg border border-dashed p-4"
                style={{ borderColor: `${primaryColor}40` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">{tSub("chatMessages")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{tSub("knowledgeBase")}</span>
                    </div>
                  </div>
                  {!pendingUpgradeRequest && (
                    <Button
                      size="sm"
                      onClick={() => setShowUpgradeModal(true)}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {tSub("upgradeFrom", { price: (subscriptionData.plan.chatbotAddonPrice / 100).toFixed(0) })}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tSub("upgradeForChatbot")}
                </p>
              </div>
            )}

            {/* Company Slots */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: primaryColor }} />
                <span className="font-medium">{tSub("companySlots")}</span>
              </div>
              <UsageMeter
                label=""
                used={subscriptionData.companySlots.used}
                limit={subscriptionData.companySlots.total}
                unlimited={subscriptionData.companySlots.unlimited}
                showPercentage={true}
                color={primaryColor}
              />
              {subscriptionData.plan.extraCompanyPrice && !subscriptionData.companySlots.unlimited && (
                <p className="text-xs text-muted-foreground">
                  {tSub("extraCompanySlot", { price: (subscriptionData.plan.extraCompanyPrice / 100).toFixed(2) })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tSub("yourCompanies")}
            </h3>
            {subscriptionData.companySlots.available !== 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowCreateCompanyModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {tSub("createCompany")}
              </Button>
            )}
          </div>
          {subscriptionData.companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tSub("noCompanies")}</p>
          ) : (
            <div className="space-y-3">
              {subscriptionData.companies.map((company) => (
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
                          <Briefcase className="h-3 w-3" />
                          {tSub("servicesCount", { count: company.serviceCount })}
                        </div>
                      </div>
                    </div>
                    <Link href={`/c/${company.slug}/admin`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {tSub("planFeatures")}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {/* AI Chatbot */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                !subscriptionData.features.aiChatbot && "bg-muted/30 border-transparent"
              )}
              style={subscriptionData.features.aiChatbot ? {
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`,
              } : undefined}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  !subscriptionData.features.aiChatbot && "bg-muted"
                )}
                style={subscriptionData.features.aiChatbot ? {
                  backgroundColor: `${primaryColor}20`,
                } : undefined}
              >
                <Bot
                  className="h-4 w-4"
                  style={{ color: subscriptionData.features.aiChatbot ? primaryColor : undefined }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  !subscriptionData.features.aiChatbot && "text-muted-foreground"
                )}>
                  {tSub("aiChatbot")}
                </p>
              </div>
              {subscriptionData.features.aiChatbot ? (
                <Check className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            {/* Custom Branding */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                !subscriptionData.features.customBranding && "bg-muted/30 border-transparent"
              )}
              style={subscriptionData.features.customBranding ? {
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`,
              } : undefined}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  !subscriptionData.features.customBranding && "bg-muted"
                )}
                style={subscriptionData.features.customBranding ? {
                  backgroundColor: `${primaryColor}20`,
                } : undefined}
              >
                <Palette
                  className="h-4 w-4"
                  style={{ color: subscriptionData.features.customBranding ? primaryColor : undefined }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  !subscriptionData.features.customBranding && "text-muted-foreground"
                )}>
                  {tSub("customBranding")}
                </p>
              </div>
              {subscriptionData.features.customBranding ? (
                <Check className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            {/* Priority Support */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                !subscriptionData.features.prioritySupport && "bg-muted/30 border-transparent"
              )}
              style={subscriptionData.features.prioritySupport ? {
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`,
              } : undefined}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  !subscriptionData.features.prioritySupport && "bg-muted"
                )}
                style={subscriptionData.features.prioritySupport ? {
                  backgroundColor: `${primaryColor}20`,
                } : undefined}
              >
                <Crown
                  className="h-4 w-4"
                  style={{ color: subscriptionData.features.prioritySupport ? primaryColor : undefined }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  !subscriptionData.features.prioritySupport && "text-muted-foreground"
                )}>
                  {tSub("prioritySupport")}
                </p>
              </div>
              {subscriptionData.features.prioritySupport ? (
                <Check className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
              ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          onSuccess={loadPendingUpgradeRequest}
          currentTier={subscriptionData.planTier}
          hasChatbot={subscriptionData.features.aiChatbot}
          primaryColor={primaryColor}
        />

        {/* Create Company Modal */}
        <CreateCompanyModal
          open={showCreateCompanyModal}
          onOpenChange={setShowCreateCompanyModal}
          onSuccess={(newCompany) => {
            // Navigate to the new company's admin dashboard
            router.push(`/${locale}/c/${newCompany.slug}/admin`);
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("settings")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("settingsSubtitle")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {tCommon("save")}
        </Button>
      </div>

      {/* Mobile: Horizontal scrollable tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {tabConfig.map((tab) => {
          const isDisabled = (tab.id === "ai" || tab.id === "bot" || tab.id === "embed") && !hasChatbotAccess;
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              title={isDisabled ? tSub("upgradeToPro") : undefined}
              className={cn(
                "shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
                isDisabled
                  ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                  : activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Desktop: Vertical sidebar + Content area */}
      <div className="flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <nav className="hidden md:block w-48 shrink-0 space-y-1 sticky top-4 self-start">
          {tabConfig.map((tab) => {
            const isDisabled = (tab.id === "ai" || tab.id === "bot" || tab.id === "embed") && !hasChatbotAccess;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                title={isDisabled ? tSub("upgradeToPro") : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                    : activeTab === tab.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && <GeneralSection />}
          {activeTab === "branding" && <BrandingSection />}
          {activeTab === "ai" && <AiChatbotSection />}
          {activeTab === "bot" && <BotPersonalitySection />}
          {activeTab === "business" && <BusinessDetailsSection />}
          {activeTab === "embed" && <EmbedSection />}
          {activeTab === "subscription" && <SubscriptionSection />}
        </div>
      </div>
    </div>
  );
}
