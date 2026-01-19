"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, Check, Building2, Palette, Bot, MessageSquare, FileText, Camera, X, ImageIcon } from "lucide-react";
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
  taxRate: number;
}

type SettingsTab = "general" | "branding" | "ai" | "bot" | "business";

const tabConfig: { id: SettingsTab; labelKey: string; icon: typeof Building2 }[] = [
  { id: "general", labelKey: "tabGeneral", icon: Building2 },
  { id: "branding", labelKey: "tabBranding", icon: Palette },
  { id: "ai", labelKey: "tabAiChatbot", icon: Bot },
  { id: "bot", labelKey: "tabBotPersonality", icon: MessageSquare },
  { id: "business", labelKey: "tabBusinessDetails", icon: FileText },
];

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

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

  const BusinessDetailsSection = () => (
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
      </div>
    </div>
  );

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
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary/10 text-primary font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Desktop: Vertical sidebar + Content area */}
      <div className="flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <nav className="hidden md:block w-48 shrink-0 space-y-1 sticky top-4 self-start">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && <GeneralSection />}
          {activeTab === "branding" && <BrandingSection />}
          {activeTab === "ai" && <AiChatbotSection />}
          {activeTab === "bot" && <BotPersonalitySection />}
          {activeTab === "business" && <BusinessDetailsSection />}
        </div>
      </div>
    </div>
  );
}
