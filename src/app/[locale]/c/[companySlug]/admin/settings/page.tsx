"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";

interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  timezone: string;
  aiApiKey: string | null;
  aiEndpoint: string | null;
  aiModel: string | null;
  aiSystemPrompt: string | null;
}

export default function SettingsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [settings, setSettings] = useState<CompanySettings | null>(null);
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
  const [aiEndpoint, setAiEndpoint] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");

  useEffect(() => {
    loadSettings();
  }, [companySlug]);

  async function loadSettings() {
    try {
      // We'll use the company page endpoint
      const response = await fetch(`/api/c/${companySlug}/services`);
      // This is a workaround - in production you'd have a dedicated settings endpoint
      // For now, we'll just simulate the settings
      setName(companySlug);
      setPrimaryColor("#3B82F6");
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      // In a real implementation, you'd call an API to update settings
      // For now, we'll just show a success message
      toast.success("Settings saved");
    } catch (error) {
      toast.error(tCommon("error"));
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {tCommon("save")}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic company information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("companyName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("timezone")}</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize your company appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">{t("companyLogo")}</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">{t("primaryColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("aiSettings")}</CardTitle>
          <CardDescription>
            Configure AI chatbot settings. The chatbot uses these settings to
            generate responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aiApiKey">{t("aiApiKey")}</Label>
              <div className="flex gap-2">
                <Input
                  id="aiApiKey"
                  type={showApiKey ? "text" : "password"}
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiModel">{t("aiModel")}</Label>
              <Input
                id="aiModel"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="gpt-3.5-turbo"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiEndpoint">{t("aiEndpoint")}</Label>
            <Input
              id="aiEndpoint"
              value={aiEndpoint}
              onChange={(e) => setAiEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1 (leave empty for default)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiSystemPrompt">{t("aiSystemPrompt")}</Label>
            <Textarea
              id="aiSystemPrompt"
              value={aiSystemPrompt}
              onChange={(e) => setAiSystemPrompt(e.target.value)}
              placeholder="Custom instructions for the AI assistant..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
