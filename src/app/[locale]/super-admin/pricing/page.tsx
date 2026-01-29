"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Euro, RotateCcw, Crown, Building2, MessageSquare, Sparkles, Coins, Plus, Trash2 } from "lucide-react";

interface PricingConfig {
  id: string;
  key: string;
  priceEurCents: number;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

interface TokenPack {
  id: string;
  name: string;
  tokenAmount: number;
  priceEurCents: number;
  isActive: boolean;
  sortOrder: number;
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

// Helper to format token amounts for display
const formatTokenAmount = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`;
  }
  return amount.toString();
};

export default function PricingConfigPage() {
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [originalPricing, setOriginalPricing] = useState<PricingConfig[]>([]);
  const [tokenPacks, setTokenPacks] = useState<TokenPack[]>([]);
  const [originalTokenPacks, setOriginalTokenPacks] = useState<TokenPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      const response = await fetch("/api/super-admin/pricing");
      if (!response.ok) throw new Error("Failed to fetch pricing");
      const data = await response.json();
      setPricing(data.pricing);
      setOriginalPricing(data.pricing);
      setTokenPacks(data.tokenPacks || []);
      setOriginalTokenPacks(data.tokenPacks || []);
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
    // Validate token pack names before save (#16)
    const emptyNamePacks = tokenPacks.filter((p) => !p.name.trim());
    if (emptyNamePacks.length > 0) {
      toast.error("All token packs must have a name");
      return;
    }

    // Check for duplicate names (#16)
    const names = tokenPacks.map((p) => p.name.trim().toLowerCase());
    const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      toast.error("Token pack names must be unique");
      return;
    }

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
          tokenPacks: tokenPacks.map((pack) => ({
            id: pack.id,
            name: pack.name.trim(), // Trim whitespace
            tokenAmount: pack.tokenAmount,
            priceEurCents: pack.priceEurCents,
            isActive: pack.isActive,
            sortOrder: pack.sortOrder,
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
      setTokenPacks(data.tokenPacks || []);
      setOriginalTokenPacks(data.tokenPacks || []);

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
    setTokenPacks(originalTokenPacks);
  };

  const hasChanges = JSON.stringify(pricing) !== JSON.stringify(originalPricing) ||
    JSON.stringify(tokenPacks) !== JSON.stringify(originalTokenPacks);

  // Token Pack handlers
  const handleAddTokenPack = () => {
    const newPack: TokenPack = {
      id: `new-${Date.now()}`,
      name: "",
      tokenAmount: 500000,
      priceEurCents: 500,
      isActive: true,
      sortOrder: tokenPacks.length,
    };
    setTokenPacks([...tokenPacks, newPack]);
  };

  const handleDeleteTokenPack = (id: string) => {
    setTokenPacks(tokenPacks.filter((p) => p.id !== id));
  };

  const handleTokenPackChange = (id: string, field: keyof TokenPack, value: string | number | boolean) => {
    setTokenPacks(
      tokenPacks.map((pack) =>
        pack.id === id ? { ...pack, [field]: value } : pack
      )
    );
  };

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

      {/* Separator */}
      <div className="border-t my-2" />

      {/* Token Packs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Token Packs
            </CardTitle>
            <CardDescription>
              Manage purchasable AI token bundles
            </CardDescription>
          </div>
          <Button onClick={handleAddTokenPack} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Pack
          </Button>
        </CardHeader>
        <CardContent>
          {tokenPacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No token packs configured</p>
              <Button onClick={handleAddTokenPack} variant="link" className="mt-2">
                Add your first token pack
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left font-medium py-3 px-2">Name</th>
                    <th className="text-left font-medium py-3 px-2 w-36">Tokens</th>
                    <th className="text-left font-medium py-3 px-2 w-32">Price</th>
                    <th className="text-left font-medium py-3 px-2 w-20">Order</th>
                    <th className="text-center font-medium py-3 px-2 w-20">Active</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {tokenPacks.map((pack) => (
                    <tr key={pack.id} className="border-b last:border-0">
                      {/* Name */}
                      <td className="py-3 px-2">
                        <Input
                          value={pack.name}
                          onChange={(e) => handleTokenPackChange(pack.id, "name", e.target.value)}
                          placeholder="Pack name"
                          className="h-9"
                        />
                      </td>

                      {/* Tokens */}
                      <td className="py-3 px-2">
                        <div className="relative">
                          <Input
                            type="number"
                            value={pack.tokenAmount}
                            onChange={(e) => handleTokenPackChange(pack.id, "tokenAmount", parseInt(e.target.value) || 0)}
                            className="h-9 pr-12"
                            min="0"
                            step="10000"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {formatTokenAmount(pack.tokenAmount)}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-2">
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(pack.priceEurCents / 100).toFixed(2)}
                            onChange={(e) => handleTokenPackChange(pack.id, "priceEurCents", Math.round(parseFloat(e.target.value || "0") * 100))}
                            className="h-9 pl-9"
                          />
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          value={pack.sortOrder}
                          onChange={(e) => handleTokenPackChange(pack.id, "sortOrder", parseInt(e.target.value) || 0)}
                          className="h-9"
                          min="0"
                        />
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3 px-2 text-center">
                        <Switch
                          checked={pack.isActive}
                          onCheckedChange={(checked) => handleTokenPackChange(pack.id, "isActive", checked)}
                        />
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTokenPack(pack.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
