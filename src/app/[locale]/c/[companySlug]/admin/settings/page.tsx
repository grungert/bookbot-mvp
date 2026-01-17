"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, Check } from "lucide-react";

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
  primaryColor: string;
  timezone: string;
  aiApiKey: string | null;
  hasAiApiKey: boolean;
  aiEndpoint: string | null;
  aiModel: string | null;
  aiSystemPrompt: string | null;
}

export default function SettingsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [timezone, setTimezone] = useState("Europe/Belgrade");
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasExistingApiKey, setHasExistingApiKey] = useState(false);
  const [aiEndpoint, setAiEndpoint] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");

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
      setPrimaryColor(settings.primaryColor || "#3B82F6");
      setTimezone(settings.timezone || "Europe/Belgrade");
      setAiApiKey(settings.aiApiKey || "");
      setHasExistingApiKey(settings.hasAiApiKey);
      setAiEndpoint(settings.aiEndpoint || "");
      setAiModel(settings.aiModel || "");
      setAiSystemPrompt(settings.aiSystemPrompt || "");
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
        primaryColor,
        timezone,
        aiEndpoint: aiEndpoint || null,
        aiModel: aiModel || null,
        aiSystemPrompt: aiSystemPrompt || null,
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
        throw new Error(error.error || "Failed to save settings");
      }

      const updatedSettings: CompanySettings = await response.json();

      // Update form with returned values
      setAiApiKey(updatedSettings.aiApiKey || "");
      setHasExistingApiKey(updatedSettings.hasAiApiKey);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your company settings and preferences
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

      {/* General Settings */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          General Information
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
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Branding
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="text-sm font-medium">{t("companyLogo")}</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">{t("primaryColor")}</Label>
            <div className="flex gap-3 items-center">
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
              This color will be used throughout your booking pages and admin interface
            </p>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          AI Chatbot
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Configure AI settings for your customer chatbot
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
                  placeholder={hasExistingApiKey ? "Enter new key to replace" : "sk-..."}
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
                  API key is configured. Enter a new key to replace it.
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
    </div>
  );
}
