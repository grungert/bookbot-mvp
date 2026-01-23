"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Euro, RotateCcw, Crown, Building2, MessageSquare, Sparkles } from "lucide-react";

interface PricingConfig {
  id: string;
  key: string;
  priceEurCents: number;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

const PRICING_ITEMS = [
  {
    key: "PRO_BASE",
    label: "Pro Starter",
    description: "Base monthly price for the Pro plan",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    key: "BUSINESS_BASE",
    label: "Business",
    description: "Unlimited companies, chat & chatbot included",
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    key: "EXTRA_COMPANY",
    label: "Extra Company",
    description: "Price per additional company slot",
    icon: Building2,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    key: "CHATBOT_ADDON",
    label: "AI Chatbot",
    description: "AI chatbot add-on for Pro plan",
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
];

export default function PricingConfigPage() {
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [originalPricing, setOriginalPricing] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      const response = await fetch("/api/super-admin/pricing");
      if (!response.ok) throw new Error("Failed to fetch pricing");
      const data = await response.json();
      setPricing(data.pricing);
      setOriginalPricing(data.pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      toast.error("Failed to load pricing configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handlePriceChange = (key: string, value: string) => {
    // Convert EUR input to cents
    const eurValue = parseFloat(value) || 0;
    const cents = Math.round(eurValue * 100);

    setPricing((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, priceEurCents: cents } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/super-admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricing: pricing.map((item) => ({
            key: item.key,
            priceEurCents: item.priceEurCents,
            description: item.description,
            isActive: item.isActive,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save pricing");
      }

      const data = await response.json();
      setPricing(data.pricing);
      setOriginalPricing(data.pricing);

      toast.success("Pricing configuration has been saved successfully");
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPricing(originalPricing);
  };

  const hasChanges = JSON.stringify(pricing) !== JSON.stringify(originalPricing);

  // Calculate example pricing
  const getExamplePricing = () => {
    const proBase = pricing.find((p) => p.key === "PRO_BASE")?.priceEurCents || 0;
    const chatbot = pricing.find((p) => p.key === "CHATBOT_ADDON")?.priceEurCents || 0;
    const extraCompany = pricing.find((p) => p.key === "EXTRA_COMPANY")?.priceEurCents || 0;
    const businessBase = pricing.find((p) => p.key === "BUSINESS_BASE")?.priceEurCents || 0;

    return {
      proOnly: proBase,
      proWithChatbot: proBase + chatbot,
      proWithChatbotAnd2Companies: proBase + chatbot + extraCompany * 2,
      business: businessBase,
    };
  };

  const examples = getExamplePricing();

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
          <h1 className="text-2xl font-bold">Pricing Configuration</h1>
          <p className="text-muted-foreground">
            Manage subscription pricing for upgrade requests
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

      {/* Pricing Items */}
      <div className="grid gap-6 md:grid-cols-2">
        {PRICING_ITEMS.map((config) => {
          const item = pricing.find((p) => p.key === config.key);
          const Icon = config.icon;
          const priceValue = item?.priceEurCents || 0;

          return (
            <Card key={config.key} className="overflow-hidden">
              <div className={`${config.bgColor} px-6 py-4 border-b`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor={config.key} className="text-sm text-muted-foreground mb-2 block">
                      Price per month
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={config.key}
                        type="number"
                        step="0.01"
                        min="0"
                        value={(priceValue / 100).toFixed(2)}
                        onChange={(e) => handlePriceChange(config.key, e.target.value)}
                        className="pl-10 text-lg font-semibold h-12"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">€{(priceValue / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                </div>
                {item?.updatedAt && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Example Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Example Pricing Calculations</CardTitle>
          <CardDescription>
            See how the pricing applies to different configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pro Plan (no chatbot)</p>
              <p className="text-2xl font-bold">
                €{(examples.proOnly / 100).toFixed(2)}<span className="text-sm font-normal">/month</span>
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pro Plan + Chatbot</p>
              <p className="text-2xl font-bold">
                €{(examples.proWithChatbot / 100).toFixed(2)}<span className="text-sm font-normal">/month</span>
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pro + Chatbot + 2 Extra Companies</p>
              <p className="text-2xl font-bold">
                €{(examples.proWithChatbotAnd2Companies / 100).toFixed(2)}<span className="text-sm font-normal">/month</span>
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Business Plan (all included)</p>
              <p className="text-2xl font-bold">
                €{(examples.business / 100).toFixed(2)}<span className="text-sm font-normal">/month</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
