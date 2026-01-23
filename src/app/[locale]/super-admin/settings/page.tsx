"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Building, CreditCard, RotateCcw, FileText } from "lucide-react";

interface SystemSettings {
  BANK_NAME: string;
  BANK_ACCOUNT_NAME: string;
  BANK_IBAN: string;
  BANK_BIC: string;
  MAX_DOCUMENT_TOKENS: string;
  MAX_CUSTOM_INSTRUCTIONS_TOKENS: string;
}

const DEFAULT_MAX_DOCUMENT_TOKENS = 1500;
const DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS = 500;

const DEFAULT_SETTINGS: SystemSettings = {
  BANK_NAME: "",
  BANK_ACCOUNT_NAME: "",
  BANK_IBAN: "",
  BANK_BIC: "",
  MAX_DOCUMENT_TOKENS: String(DEFAULT_MAX_DOCUMENT_TOKENS),
  MAX_CUSTOM_INSTRUCTIONS_TOKENS: String(DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS),
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/super-admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      const merged = { ...DEFAULT_SETTINGS, ...data.settings };
      setSettings(merged);
      setOriginalSettings(merged);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: keyof SystemSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      const data = await response.json();
      const merged = { ...DEFAULT_SETTINGS, ...data.settings };
      setSettings(merged);
      setOriginalSettings(merged);

      toast.success("Bank details saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and bank details for payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
              <Building className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>
                These details will be sent to users when they request an upgrade via bank transfer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., Raiffeisen Bank"
                value={settings.BANK_NAME}
                onChange={(e) => handleChange("BANK_NAME", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input
                id="accountName"
                placeholder="e.g., BookBot DOO"
                value={settings.BANK_ACCOUNT_NAME}
                onChange={(e) => handleChange("BANK_ACCOUNT_NAME", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="iban"
                  placeholder="e.g., RS35 1234 5678 9012 3456 78"
                  value={settings.BANK_IBAN}
                  onChange={(e) => handleChange("BANK_IBAN", e.target.value)}
                  className="pl-10 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                International Bank Account Number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bic">BIC / SWIFT Code</Label>
              <Input
                id="bic"
                placeholder="e.g., RABORARS"
                value={settings.BANK_BIC}
                onChange={(e) => handleChange("BANK_BIC", e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Bank Identifier Code for international transfers
              </p>
            </div>
          </div>

          {/* Preview */}
          {(settings.BANK_NAME || settings.BANK_IBAN) && (
            <div className="rounded-lg border bg-muted/50 p-4 mt-6">
              <p className="text-sm font-medium mb-3">Preview (as shown to users):</p>
              <div className="space-y-2 text-sm">
                {settings.BANK_NAME && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-32">Bank:</span>
                    <span className="font-medium">{settings.BANK_NAME}</span>
                  </div>
                )}
                {settings.BANK_ACCOUNT_NAME && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-32">Account Name:</span>
                    <span className="font-medium">{settings.BANK_ACCOUNT_NAME}</span>
                  </div>
                )}
                {settings.BANK_IBAN && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-32">IBAN:</span>
                    <span className="font-mono font-medium">{settings.BANK_IBAN}</span>
                  </div>
                )}
                {settings.BANK_BIC && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-32">BIC/SWIFT:</span>
                    <span className="font-mono font-medium">{settings.BANK_BIC}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950/30">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Knowledge Base Limits</CardTitle>
              <CardDescription>
                Configure token limits for knowledge base documents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxDocumentTokens">Max Tokens per Document</Label>
              <Input
                id="maxDocumentTokens"
                type="number"
                min="100"
                max="100000"
                placeholder="1500"
                value={settings.MAX_DOCUMENT_TOKENS}
                onChange={(e) => handleChange("MAX_DOCUMENT_TOKENS", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ~{Math.round(parseInt(settings.MAX_DOCUMENT_TOKENS || "1500") * 4).toLocaleString()} characters
              </p>
              <p className="text-xs text-muted-foreground">
                Limit for each knowledge base document. Default: 1,500 tokens.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCustomInstructionsTokens">Max Tokens for Custom Instructions</Label>
              <Input
                id="maxCustomInstructionsTokens"
                type="number"
                min="100"
                max="10000"
                placeholder="500"
                value={settings.MAX_CUSTOM_INSTRUCTIONS_TOKENS}
                onChange={(e) => handleChange("MAX_CUSTOM_INSTRUCTIONS_TOKENS", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ~{Math.round(parseInt(settings.MAX_CUSTOM_INSTRUCTIONS_TOKENS || "500") * 4).toLocaleString()} characters
              </p>
              <p className="text-xs text-muted-foreground">
                Limit for bot custom instructions. Default: 500 tokens.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
