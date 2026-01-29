"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Calculator,
  Cpu,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Edit,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  calculatePricing,
  getDefaultParams,
  formatCurrency,
  formatPercent,
  type SimulationParams,
  type CalculationResults,
} from "@/lib/calculator/pricing-calculator";

interface LLMModelPricing {
  id: string;
  provider: string;
  modelName: string;
  displayName: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface PricingScenario {
  id: string;
  name: string;
  parameters: SimulationParams;
  results: CalculationResults;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "text-emerald-600",
  anthropic: "text-orange-600",
  google: "text-blue-600",
  custom: "text-purple-600",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getMonthName = (month: number) => MONTH_NAMES[(month - 1) % 12] || `M${month}`;

// Custom tooltip component for charts
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  decimals?: number;
}

const CustomTooltip = ({ active, payload, label, valuePrefix = "$", valueSuffix = "", decimals = 2 }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="font-medium text-sm mb-2">{getMonthName(label as number)}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">
              {valuePrefix}{entry.value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simpler tooltip for single-value charts
const SimpleTooltip = ({ active, payload, label, valuePrefix = "$", decimals = 2 }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">{getMonthName(label as number)}</p>
      <p className="text-lg font-bold" style={{ color: payload[0].color }}>
        {valuePrefix}{payload[0].value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      </p>
    </div>
  );
};

export default function CalculatorPage() {
  // State
  const [llmPricing, setLlmPricing] = useState<LLMModelPricing[]>([]);
  const [scenarios, setScenarios] = useState<PricingScenario[]>([]);
  const [params, setParams] = useState<SimulationParams>(getDefaultParams());
  const [loading, setLoading] = useState(true);
  const [savingScenario, setSavingScenario] = useState(false);

  // UI state
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingModel, setEditingModel] = useState<LLMModelPricing | null>(null);
  const [showSaveScenario, setShowSaveScenario] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    llmConfig: true,
    simulation: true,
    results: true,
    charts: true,
    scenarios: false,
  });

  // New model form state
  const [newModel, setNewModel] = useState({
    provider: "custom",
    modelName: "",
    displayName: "",
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    isDefault: false,
  });

  // Calculate results whenever params change
  const results = useMemo(() => calculatePricing(params), [params]);

  // Fetch data
  const fetchLlmPricing = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/llm-pricing");
      if (!response.ok) throw new Error("Failed to fetch LLM pricing");
      const data = await response.json();
      setLlmPricing(data.llmPricing || []);

      // Set default model if available
      const defaultModel = data.llmPricing?.find((m: LLMModelPricing) => m.isDefault && m.isActive);
      if (defaultModel) {
        setParams((prev) => ({
          ...prev,
          selectedModelId: defaultModel.id,
          inputPricePer1M: Number(defaultModel.inputPricePer1M),
          outputPricePer1M: Number(defaultModel.outputPricePer1M),
        }));
      }
    } catch (error) {
      console.error("Error fetching LLM pricing:", error);
      toast.error("Failed to load LLM pricing");
    }
  }, []);

  const fetchScenarios = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/calculator/scenarios");
      if (!response.ok) throw new Error("Failed to fetch scenarios");
      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchLlmPricing(), fetchScenarios()]).finally(() =>
      setLoading(false)
    );
  }, [fetchLlmPricing, fetchScenarios]);

  // Handlers
  const handleModelSelect = (modelId: string) => {
    const model = llmPricing.find((m) => m.id === modelId);
    if (model) {
      setParams((prev) => ({
        ...prev,
        selectedModelId: modelId,
        inputPricePer1M: Number(model.inputPricePer1M),
        outputPricePer1M: Number(model.outputPricePer1M),
      }));
    }
  };

  const handleParamChange = (key: keyof SimulationParams, value: number | string) => {
    setParams((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddModel = async () => {
    if (!newModel.modelName.trim() || !newModel.displayName.trim()) {
      toast.error("Model name and display name are required");
      return;
    }

    try {
      const response = await fetch("/api/super-admin/llm-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModel),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add model");
      }

      toast.success("Model added successfully");
      setShowAddModel(false);
      setNewModel({
        provider: "custom",
        modelName: "",
        displayName: "",
        inputPricePer1M: 0,
        outputPricePer1M: 0,
        isDefault: false,
      });
      fetchLlmPricing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add model");
    }
  };

  const handleUpdateModel = async (model: LLMModelPricing) => {
    try {
      const response = await fetch("/api/super-admin/llm-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update model");
      }

      toast.success("Model updated");
      setEditingModel(null);
      fetchLlmPricing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update model");
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const response = await fetch(`/api/super-admin/llm-pricing?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete model");
      }

      toast.success("Model deleted");
      fetchLlmPricing();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete model");
    }
  };

  const handleSetDefault = async (id: string) => {
    const model = llmPricing.find((m) => m.id === id);
    if (model) {
      await handleUpdateModel({ ...model, isDefault: true });
    }
  };

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) {
      toast.error("Scenario name is required");
      return;
    }

    setSavingScenario(true);
    try {
      const response = await fetch("/api/super-admin/calculator/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenarioName.trim(),
          parameters: params,
          results,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save scenario");
      }

      toast.success("Scenario saved");
      setShowSaveScenario(false);
      setScenarioName("");
      fetchScenarios();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save scenario");
    } finally {
      setSavingScenario(false);
    }
  };

  const handleLoadScenario = (scenario: PricingScenario) => {
    setParams(scenario.parameters);
    toast.success(`Loaded scenario: ${scenario.name}`);
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      const response = await fetch(`/api/super-admin/calculator/scenarios?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete scenario");
      }

      toast.success("Scenario deleted");
      fetchScenarios();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete scenario");
    }
  };

  const handleReset = () => {
    setParams(getDefaultParams());
    toast.success("Parameters reset to defaults");
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Format helpers
  const formatUSD = (amount: number) => formatCurrency(amount, "USD");
  const formatEUR = (amount: number) => formatCurrency(amount, "EUR");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7" />
            Pricing Calculator
          </h1>
          <p className="text-muted-foreground">
            Configure LLM costs, simulate usage, and calculate optimal pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={() => setShowSaveScenario(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save Scenario
          </Button>
        </div>
      </div>

      {/* Section 1: LLM Model Configuration */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("llmConfig")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              <CardTitle>LLM Provider Costs</CardTitle>
            </div>
            {expandedSections.llmConfig ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription>
            Configure and manage LLM model pricing for cost calculations
          </CardDescription>
        </CardHeader>
        {expandedSections.llmConfig && (
          <CardContent>
            <div className="space-y-4">
              {/* Model selector */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Select Model for Calculations</Label>
                  <Select
                    value={params.selectedModelId}
                    onValueChange={handleModelSelect}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {llmPricing
                        .filter((m) => m.isActive)
                        .map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <span className={PROVIDER_COLORS[model.provider]}>
                              [{model.provider}]
                            </span>{" "}
                            {model.displayName}
                            {model.isDefault && " (default)"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModel(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Model
                  </Button>
                </div>
              </div>

              {/* Current pricing display */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Input Price</Label>
                  <p className="text-2xl font-bold">
                    ${params.inputPricePer1M.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / 1M tokens
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Output Price</Label>
                  <p className="text-2xl font-bold">
                    ${params.outputPricePer1M.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / 1M tokens
                    </span>
                  </p>
                </div>
              </div>

              {/* Models table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left font-medium py-2 px-3">
                        Provider
                      </th>
                      <th className="text-left font-medium py-2 px-3">Model</th>
                      <th className="text-right font-medium py-2 px-3">
                        Input $/1M
                      </th>
                      <th className="text-right font-medium py-2 px-3">
                        Output $/1M
                      </th>
                      <th className="text-center font-medium py-2 px-3">
                        Default
                      </th>
                      <th className="text-center font-medium py-2 px-3">
                        Active
                      </th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {llmPricing.map((model) => (
                      <tr
                        key={model.id}
                        className="border-t hover:bg-muted/50"
                      >
                        <td className="py-2 px-3">
                          <span className={PROVIDER_COLORS[model.provider]}>
                            {model.provider}
                          </span>
                        </td>
                        <td className="py-2 px-3">{model.displayName}</td>
                        <td className="py-2 px-3 text-right">
                          ${Number(model.inputPricePer1M).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          ${Number(model.outputPricePer1M).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {model.isDefault ? (
                            <span className="text-green-500">Yes</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(model.id)}
                            >
                              Set
                            </Button>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Switch
                            checked={model.isActive}
                            onCheckedChange={(checked) =>
                              handleUpdateModel({ ...model, isActive: checked })
                            }
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingModel(model)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Section 2: Usage Simulation Parameters */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("simulation")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <CardTitle>Business Simulation</CardTitle>
            </div>
            {expandedSections.simulation ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription>
            Configure customer base, usage patterns, and operating costs
          </CardDescription>
        </CardHeader>
        {expandedSections.simulation && (
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Customer Base */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Customer Base
                </h4>
                <div>
                  <Label>Total Paying Customers</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.totalCustomers}
                    onChange={(e) =>
                      handleParamChange("totalCustomers", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Pro Plan % ({params.proPercent}%)</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={params.proPercent}
                    onChange={(e) =>
                      handleParamChange("proPercent", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Business Plan % ({params.businessPercent}%)</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={params.businessPercent}
                    onChange={(e) =>
                      handleParamChange("businessPercent", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>
                    Pro with Chatbot % ({params.proChatbotPercent}%)
                  </Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={params.proChatbotPercent}
                    onChange={(e) =>
                      handleParamChange("proChatbotPercent", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Avg Extra Companies per Pro User</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={params.avgExtraCompaniesProUser}
                    onChange={(e) =>
                      handleParamChange("avgExtraCompaniesProUser", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Usage Patterns */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Usage Patterns
                </h4>
                <div>
                  <Label>Avg Messages/Customer/Month</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.avgMessagesPerMonth}
                    onChange={(e) =>
                      handleParamChange("avgMessagesPerMonth", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Avg Input Tokens/Message</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.avgInputTokens}
                    onChange={(e) =>
                      handleParamChange("avgInputTokens", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Avg Output Tokens/Message</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.avgOutputTokens}
                    onChange={(e) =>
                      handleParamChange("avgOutputTokens", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tool Calls per Message (avg)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={params.toolCallsPerMessage}
                    onChange={(e) =>
                      handleParamChange("toolCallsPerMessage", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tokens per Tool Call</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.tokensPerToolCall}
                    onChange={(e) =>
                      handleParamChange("tokensPerToolCall", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Content & Embeddings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Content
                </h4>
                <div>
                  <Label>Avg Documents per Company</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.avgDocsPerCompany}
                    onChange={(e) =>
                      handleParamChange("avgDocsPerCompany", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Avg Tokens per Document</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.avgTokensPerDoc}
                    onChange={(e) =>
                      handleParamChange("avgTokensPerDoc", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Embedding Cost $/1M</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={params.embeddingCostPer1M}
                    onChange={(e) =>
                      handleParamChange("embeddingCostPer1M", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Growth & Churn */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Growth & Churn
                </h4>
                <div>
                  <Label>Monthly Growth Rate % ({params.monthlyGrowthRate}%)</Label>
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={params.monthlyGrowthRate}
                    onChange={(e) =>
                      handleParamChange("monthlyGrowthRate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Monthly Churn Rate % ({params.monthlyChurnRate}%)</Label>
                  <Input
                    type="range"
                    min="0"
                    max="20"
                    value={params.monthlyChurnRate}
                    onChange={(e) =>
                      handleParamChange("monthlyChurnRate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Projection Months</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={params.projectionMonths}
                    onChange={(e) =>
                      handleParamChange("projectionMonths", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Operating Costs */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Operating Costs
                </h4>
                <div>
                  <Label>Infrastructure $/month</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.infraMonthlyCost}
                    onChange={(e) =>
                      handleParamChange("infraMonthlyCost", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Support Hours per 100 Customers</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={params.supportHoursPer100}
                    onChange={(e) =>
                      handleParamChange("supportHoursPer100", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Support Hourly Rate $</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.supportHourlyRate}
                    onChange={(e) =>
                      handleParamChange("supportHourlyRate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Payment Processing Fee %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={params.paymentFeePercent}
                    onChange={(e) =>
                      handleParamChange("paymentFeePercent", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Current Pricing */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Current Pricing (EUR)
                </h4>
                <div>
                  <Label>Pro Base Price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.proBasePrice}
                    onChange={(e) =>
                      handleParamChange("proBasePrice", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chatbot Addon Price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.chatbotAddonPrice}
                    onChange={(e) =>
                      handleParamChange("chatbotAddonPrice", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Extra Company Price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.extraCompanyPrice}
                    onChange={(e) =>
                      handleParamChange("extraCompanyPrice", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Business Base Price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={params.businessBasePrice}
                    onChange={(e) =>
                      handleParamChange("businessBasePrice", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Section 3: Results Dashboard */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("results")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <CardTitle>Cost Analysis & Recommendations</CardTitle>
            </div>
            {expandedSections.results ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.results && (
          <CardContent>
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Cost per Message
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(results.costPerMessage)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Tokens per Message
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(results.tokensPerMessage)}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    LLM Cost/User/Month
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(results.llmCostPerUserMonth)}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Overall Margin</p>
                  <p
                    className={`text-2xl font-bold ${
                      results.overallMargin >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercent(results.overallMargin)}
                  </p>
                </div>
              </div>

              {/* Per-Customer Costs */}
              <div>
                <h4 className="font-semibold mb-3">
                  Per-Customer Monthly Costs (USD)
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Pro (no chatbot)
                    </p>
                    <p className="text-xl font-bold">
                      {formatUSD(results.proNoChatbotCost)}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Infra: {formatUSD(results.costBreakdown.pro.infra)}</p>
                      <p>
                        Support: {formatUSD(results.costBreakdown.pro.support)}
                      </p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Pro (with chatbot)
                    </p>
                    <p className="text-xl font-bold">
                      {formatUSD(results.proWithChatbotCost)}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>
                        LLM: {formatUSD(results.costBreakdown.proChatbot.llm)}
                      </p>
                      <p>
                        Infra:{" "}
                        {formatUSD(results.costBreakdown.proChatbot.infra)}
                      </p>
                      <p>
                        Support:{" "}
                        {formatUSD(results.costBreakdown.proChatbot.support)}
                      </p>
                      <p>
                        Embedding:{" "}
                        {formatUSD(results.costBreakdown.proChatbot.embedding)}
                      </p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Business</p>
                    <p className="text-xl font-bold">
                      {formatUSD(results.businessCost)}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>
                        LLM: {formatUSD(results.costBreakdown.business.llm)}
                      </p>
                      <p>
                        Infra: {formatUSD(results.costBreakdown.business.infra)}
                      </p>
                      <p>
                        Support:{" "}
                        {formatUSD(results.costBreakdown.business.support)}
                      </p>
                      <p>
                        Embedding:{" "}
                        {formatUSD(results.costBreakdown.business.embedding)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Margins Table */}
              <div>
                <h4 className="font-semibold mb-3">
                  Revenue vs Cost (Current Pricing)
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left font-medium py-2 px-3">
                          Metric
                        </th>
                        <th className="text-right font-medium py-2 px-3">
                          Pro
                        </th>
                        <th className="text-right font-medium py-2 px-3">
                          Pro + Chatbot
                        </th>
                        <th className="text-right font-medium py-2 px-3">
                          Business
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="py-2 px-3">Current Price</td>
                        <td className="py-2 px-3 text-right">
                          {formatEUR(params.proBasePrice)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatEUR(
                            params.proBasePrice + params.chatbotAddonPrice
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatEUR(params.businessBasePrice)}
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 px-3">Total Cost (USD)</td>
                        <td className="py-2 px-3 text-right">
                          {formatUSD(results.proNoChatbotCost)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatUSD(results.proWithChatbotCost)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatUSD(results.businessCost)}
                        </td>
                      </tr>
                      <tr className="border-t font-semibold">
                        <td className="py-2 px-3">Margin</td>
                        <td
                          className={`py-2 px-3 text-right ${
                            results.proMargin >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercent(results.proMargin)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            results.proChatbotMargin >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercent(results.proChatbotMargin)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            results.businessMargin >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercent(results.businessMargin)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Recommendations */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-500" />
                    Break-Even Prices (EUR)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pro minimum:</span>
                      <span className="font-medium">
                        {formatEUR(results.proBreakEven)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pro+Chatbot minimum:</span>
                      <span className="font-medium">
                        {formatEUR(results.proChatbotBreakEven)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Business minimum:</span>
                      <span className="font-medium">
                        {formatEUR(results.businessBreakEven)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Recommended Prices (30% margin, EUR)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pro recommended:</span>
                      <span className="font-bold text-green-600">
                        {formatEUR(results.proRecommended)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pro+Chatbot recommended:</span>
                      <span className="font-bold text-green-600">
                        {formatEUR(results.proChatbotRecommended)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Business recommended:</span>
                      <span className="font-bold text-green-600">
                        {formatEUR(results.businessRecommended)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projection Totals */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Total Revenue ({params.projectionMonths} months)
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(results.totalRevenue)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Total Costs ({params.projectionMonths} months)
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(results.totalCosts)}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-4 ${
                    results.totalProfit >= 0
                      ? "bg-green-100 dark:bg-green-950/30"
                      : "bg-red-100 dark:bg-red-950/30"
                  }`}
                >
                  <p className="text-sm text-muted-foreground">
                    Total Profit ({params.projectionMonths} months)
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      results.totalProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatUSD(results.totalProfit)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Section 4: Projection Charts */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("charts")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <CardTitle>{params.projectionMonths}-Month Projection</CardTitle>
            </div>
            {expandedSections.charts ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.charts && (
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Customer Growth */}
              <div className="border rounded-xl p-5 bg-card/50">
                <h4 className="font-semibold">Customer Growth</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Projected customer count by plan type with growth and churn applied monthly
                </p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={results.monthlyProjections}
                      margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={getMonthName}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip content={<CustomTooltip valuePrefix="" decimals={0} />} />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalCustomers"
                        name="Total"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="proCustomers"
                        name="Pro"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="businessCustomers"
                        name="Business"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue vs Costs */}
              <div className="border rounded-xl p-5 bg-card/50">
                <h4 className="font-semibold">Revenue vs Costs</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Monthly revenue from subscriptions compared to total operating costs
                </p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={results.monthlyProjections}
                      margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={getMonthName}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tickFormatter={(v) =>
                          v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#22c55e"
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalCosts"
                        name="Costs"
                        stroke="#ef4444"
                        fill="url(#colorCosts)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cumulative Profit */}
              <div className="border rounded-xl p-5 bg-card/50">
                <h4 className="font-semibold">Cumulative Profit</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Running total of profit over time (revenue minus all costs, accumulated month by month)
                </p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={results.monthlyProjections}
                      margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={getMonthName}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tickFormatter={(v) =>
                          v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                        }
                      />
                      <Tooltip content={<SimpleTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulativeProfit"
                        name="Cumulative Profit"
                        stroke="#8b5cf6"
                        fill="url(#colorProfit)"
                        strokeWidth={2}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="border rounded-xl p-5 bg-card/50">
                <h4 className="font-semibold">Monthly Cost Breakdown</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Stacked view of monthly costs: LLM API usage, infrastructure, support, and payment fees
                </p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results.monthlyProjections}
                      margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={getMonthName}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tickFormatter={(v) =>
                          v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="square"
                        iconSize={10}
                      />
                      <Bar
                        dataKey="llmCosts"
                        name="LLM"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="infraCosts"
                        name="Infrastructure"
                        stackId="a"
                        fill="#8b5cf6"
                      />
                      <Bar
                        dataKey="supportCosts"
                        name="Support"
                        stackId="a"
                        fill="#f59e0b"
                      />
                      <Bar
                        dataKey="paymentFees"
                        name="Payment Fees"
                        stackId="a"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Section 5: Saved Scenarios */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("scenarios")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-cyan-500" />
              <CardTitle>Saved Scenarios</CardTitle>
              {scenarios.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({scenarios.length})
                </span>
              )}
            </div>
            {expandedSections.scenarios ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {expandedSections.scenarios && (
          <CardContent>
            {scenarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No saved scenarios</p>
                <Button
                  variant="link"
                  onClick={() => setShowSaveScenario(true)}
                >
                  Save your first scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(scenario.updatedAt).toLocaleDateString()} -{" "}
                        {(scenario.parameters as SimulationParams).totalCustomers} customers,{" "}
                        {formatPercent(
                          (scenario.results as CalculationResults).overallMargin
                        )}{" "}
                        margin
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadScenario(scenario)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add Model Dialog */}
      <Dialog open={showAddModel} onOpenChange={setShowAddModel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add LLM Model</DialogTitle>
            <DialogDescription>
              Add a new LLM model with its pricing information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Provider</Label>
              <Select
                value={newModel.provider}
                onValueChange={(value) =>
                  setNewModel({ ...newModel, provider: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model Name (ID)</Label>
              <Input
                value={newModel.modelName}
                onChange={(e) =>
                  setNewModel({ ...newModel, modelName: e.target.value })
                }
                placeholder="e.g., gpt-4o"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={newModel.displayName}
                onChange={(e) =>
                  setNewModel({ ...newModel, displayName: e.target.value })
                }
                placeholder="e.g., GPT-4o"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Input Price $/1M tokens</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newModel.inputPricePer1M}
                  onChange={(e) =>
                    setNewModel({
                      ...newModel,
                      inputPricePer1M: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Output Price $/1M tokens</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newModel.outputPricePer1M}
                  onChange={(e) =>
                    setNewModel({
                      ...newModel,
                      outputPricePer1M: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newModel.isDefault}
                onCheckedChange={(checked) =>
                  setNewModel({ ...newModel, isDefault: checked })
                }
              />
              <Label>Set as default model</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModel(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddModel}>Add Model</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Model Dialog */}
      {editingModel && (
        <Dialog open={!!editingModel} onOpenChange={() => setEditingModel(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit LLM Model</DialogTitle>
              <DialogDescription>
                Update the model pricing information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Provider</Label>
                <Select
                  value={editingModel.provider}
                  onValueChange={(value) =>
                    setEditingModel({ ...editingModel, provider: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model Name (ID)</Label>
                <Input
                  value={editingModel.modelName}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      modelName: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={editingModel.displayName}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      displayName: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Input Price $/1M tokens</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number(editingModel.inputPricePer1M)}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        inputPricePer1M: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Output Price $/1M tokens</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number(editingModel.outputPricePer1M)}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        outputPricePer1M: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingModel(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateModel(editingModel)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Save Scenario Dialog */}
      <Dialog open={showSaveScenario} onOpenChange={setShowSaveScenario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Save the current parameters and results for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Scenario Name</Label>
            <Input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Conservative Growth Scenario"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveScenario(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveScenario} disabled={savingScenario}>
              {savingScenario && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
