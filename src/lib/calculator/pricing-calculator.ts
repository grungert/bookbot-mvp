/**
 * Pricing Calculator - Core calculation logic for super admin
 *
 * This module provides comprehensive pricing calculations including:
 * - LLM cost per message
 * - Monthly costs per customer type
 * - Break-even prices
 * - Recommended pricing (with configurable margin)
 * - Monthly projections with growth/churn
 */

export interface SimulationParams {
  // Customer base
  totalCustomers: number;
  proPercent: number;          // % of customers on Pro plan (0-100)
  businessPercent: number;     // % of customers on Business plan (0-100)
  proChatbotPercent: number;   // % of Pro customers with chatbot addon (0-100)
  avgExtraCompaniesProUser: number;  // Average extra companies per Pro user

  // Usage patterns
  avgMessagesPerMonth: number;
  avgInputTokens: number;      // Per message
  avgOutputTokens: number;     // Per message
  toolCallsPerMessage: number;
  tokensPerToolCall: number;

  // Content/documents
  avgDocsPerCompany: number;
  avgTokensPerDoc: number;
  embeddingCostPer1M: number;  // USD per 1M tokens for embeddings

  // First message overhead (system prompt tokens)
  firstMessageOverheadTokens: number;  // System prompt tokens for first message
  avgMessagesPerConversation: number;  // Average messages per conversation (to calculate conversations/month)

  // Growth & churn
  monthlyGrowthRate: number;   // % (0-100)
  monthlyChurnRate: number;    // % (0-100)
  projectionMonths: number;

  // Operating costs
  infraMonthlyCost: number;    // USD
  supportHoursPer100: number;  // Hours per 100 customers
  supportHourlyRate: number;   // USD per hour
  paymentFeePercent: number;   // % (e.g., 2.9)

  // Business tier multipliers
  businessLlmMultiplier: number;        // Multiplier for LLM usage (default: 1.5)
  businessInfraMultiplier: number;      // Multiplier for infra cost (default: 1.2)
  businessSupportMultiplier: number;    // Multiplier for support cost (default: 0.8)
  businessCompaniesMultiplier: number;  // Multiplier for companies/embedding (default: 3)

  // LLM pricing (USD per 1M tokens)
  selectedModelId: string;
  inputPricePer1M: number;
  outputPricePer1M: number;

  // Current pricing (EUR)
  proBasePrice: number;
  chatbotAddonPrice: number;
  extraCompanyPrice: number;
  businessBasePrice: number;
}

export interface MonthlyProjection {
  month: number;
  totalCustomers: number;
  proCustomers: number;
  proChatbotCustomers: number;
  businessCustomers: number;
  revenue: number;
  llmCosts: number;
  infraCosts: number;
  supportCosts: number;
  embeddingCosts: number;
  paymentFees: number;
  totalCosts: number;
  profit: number;
  cumulativeProfit: number;
}

export interface CalculationResults {
  // Per-customer monthly costs (USD)
  proNoChatbotCost: number;
  proWithChatbotCost: number;
  businessCost: number;

  // Cost breakdown per customer type (USD)
  costBreakdown: {
    pro: {
      llm: number;
      infra: number;
      support: number;
      embedding: number;
    };
    proChatbot: {
      llm: number;
      infra: number;
      support: number;
      embedding: number;
    };
    business: {
      llm: number;
      infra: number;
      support: number;
      embedding: number;
    };
  };

  // Current margins (with current pricing)
  proMargin: number;           // %
  proChatbotMargin: number;    // %
  businessMargin: number;      // %

  // Break-even prices (EUR) - minimum price to not lose money
  proBreakEven: number;
  proChatbotBreakEven: number;
  businessBreakEven: number;

  // Recommended prices (EUR) - with target margin
  proRecommended: number;
  proChatbotRecommended: number;
  businessRecommended: number;

  // Monthly projections
  monthlyProjections: MonthlyProjection[];

  // Totals over projection period
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;

  // Key metrics
  averageRevenuePerCustomer: number;
  averageCostPerCustomer: number;
  overallMargin: number;

  // LLM specific
  costPerMessage: number;
  tokensPerMessage: number;
  llmCostPerUserMonth: number;

  // First message overhead
  firstMessageOverheadCost: number;  // Monthly cost of system prompt overhead per user
  conversationsPerMonth: number;     // Estimated conversations per user per month
}

// EUR/USD exchange rate (configurable)
const EUR_USD_RATE = 1.08; // 1 EUR = 1.08 USD

// Target margin for recommended pricing
const TARGET_MARGIN = 0.30; // 30%

/**
 * Calculate comprehensive pricing analysis
 */
export function calculatePricing(params: SimulationParams): CalculationResults {
  // Calculate customer counts
  const proCustomers = Math.round(params.totalCustomers * (params.proPercent / 100));
  const businessCustomers = Math.round(params.totalCustomers * (params.businessPercent / 100));
  const proChatbotCustomers = Math.round(proCustomers * (params.proChatbotPercent / 100));
  const proNoChatbotCustomers = proCustomers - proChatbotCustomers;

  // LLM cost calculations
  const tokensPerMessage = params.avgInputTokens + params.avgOutputTokens +
    (params.toolCallsPerMessage * params.tokensPerToolCall);

  const costPerMessage =
    (params.avgInputTokens / 1_000_000 * params.inputPricePer1M) +
    ((params.avgOutputTokens + params.toolCallsPerMessage * params.tokensPerToolCall) / 1_000_000 * params.outputPricePer1M);

  // First message overhead calculation
  // Each conversation starts with a system prompt that adds significant token cost
  const conversationsPerMonth = params.avgMessagesPerConversation > 0
    ? params.avgMessagesPerMonth / params.avgMessagesPerConversation
    : params.avgMessagesPerMonth / 5; // Default to 5 messages per conversation

  const firstMessageOverheadCost =
    (params.firstMessageOverheadTokens / 1_000_000) * params.inputPricePer1M * conversationsPerMonth;

  // Monthly LLM cost per chatbot user (including first message overhead)
  const baseLlmCost = costPerMessage * params.avgMessagesPerMonth;
  const llmCostPerUserMonth = baseLlmCost + firstMessageOverheadCost;

  // Embedding cost per company (one-time amortized over months - assume refreshed monthly)
  const embeddingCostPerCompany =
    (params.avgDocsPerCompany * params.avgTokensPerDoc / 1_000_000) * params.embeddingCostPer1M;

  // Support cost per customer
  const supportCostPerCustomer = (params.supportHoursPer100 / 100) * params.supportHourlyRate;

  // Infra cost per customer (distributed)
  const infraCostPerCustomer = params.totalCustomers > 0
    ? params.infraMonthlyCost / params.totalCustomers
    : 0;

  // Cost breakdown by customer type
  const costBreakdown = {
    pro: {
      llm: 0, // No chatbot
      infra: infraCostPerCustomer,
      support: supportCostPerCustomer,
      embedding: 0, // No chatbot
    },
    proChatbot: {
      llm: llmCostPerUserMonth,
      infra: infraCostPerCustomer,
      support: supportCostPerCustomer,
      embedding: embeddingCostPerCompany * (1 + params.avgExtraCompaniesProUser),
    },
    business: {
      llm: llmCostPerUserMonth * params.businessLlmMultiplier,
      infra: infraCostPerCustomer * params.businessInfraMultiplier,
      support: supportCostPerCustomer * params.businessSupportMultiplier,
      embedding: embeddingCostPerCompany * params.businessCompaniesMultiplier,
    },
  };

  // Total costs per customer type (USD)
  const proNoChatbotCost = costBreakdown.pro.llm + costBreakdown.pro.infra +
    costBreakdown.pro.support + costBreakdown.pro.embedding;

  const proWithChatbotCost = costBreakdown.proChatbot.llm + costBreakdown.proChatbot.infra +
    costBreakdown.proChatbot.support + costBreakdown.proChatbot.embedding;

  const businessCost = costBreakdown.business.llm + costBreakdown.business.infra +
    costBreakdown.business.support + costBreakdown.business.embedding;

  // Convert current prices from EUR to USD for comparison
  const proBasePriceUSD = params.proBasePrice * EUR_USD_RATE;
  const proChatbotPriceUSD = (params.proBasePrice + params.chatbotAddonPrice) * EUR_USD_RATE;
  const businessPriceUSD = params.businessBasePrice * EUR_USD_RATE;

  // Calculate payment fees
  const proPaymentFee = proBasePriceUSD * (params.paymentFeePercent / 100);
  const proChatbotPaymentFee = proChatbotPriceUSD * (params.paymentFeePercent / 100);
  const businessPaymentFee = businessPriceUSD * (params.paymentFeePercent / 100);

  // Total costs including payment fees
  const proTotalCost = proNoChatbotCost + proPaymentFee;
  const proChatbotTotalCost = proWithChatbotCost + proChatbotPaymentFee;
  const businessTotalCost = businessCost + businessPaymentFee;

  // Calculate margins
  const calculateMargin = (revenue: number, cost: number): number => {
    if (revenue <= 0) return -100;
    return ((revenue - cost) / revenue) * 100;
  };

  const proMargin = calculateMargin(proBasePriceUSD, proTotalCost);
  const proChatbotMargin = calculateMargin(proChatbotPriceUSD, proChatbotTotalCost);
  const businessMargin = calculateMargin(businessPriceUSD, businessTotalCost);

  // Break-even prices (USD converted to EUR)
  // Break-even = cost / (1 - paymentFeePercent/100)
  const calculateBreakEven = (cost: number): number => {
    const breakEvenUSD = cost / (1 - params.paymentFeePercent / 100);
    return breakEvenUSD / EUR_USD_RATE;
  };

  const proBreakEven = calculateBreakEven(proNoChatbotCost);
  const proChatbotBreakEven = calculateBreakEven(proWithChatbotCost);
  const businessBreakEven = calculateBreakEven(businessCost);

  // Recommended prices (with target margin)
  const calculateRecommended = (cost: number): number => {
    // price = cost / (1 - targetMargin - paymentFeePercent)
    const recommendedUSD = cost / (1 - TARGET_MARGIN - params.paymentFeePercent / 100);
    return recommendedUSD / EUR_USD_RATE;
  };

  const proRecommended = calculateRecommended(proNoChatbotCost);
  const proChatbotRecommended = calculateRecommended(proWithChatbotCost);
  const businessRecommended = calculateRecommended(businessCost);

  // Monthly projections
  const monthlyProjections: MonthlyProjection[] = [];
  let cumulativeProfit = 0;
  let currentCustomers = params.totalCustomers;

  for (let month = 1; month <= params.projectionMonths; month++) {
    // Apply growth and churn
    const newCustomers = Math.round(currentCustomers * (params.monthlyGrowthRate / 100));
    const churnedCustomers = Math.round(currentCustomers * (params.monthlyChurnRate / 100));
    currentCustomers = currentCustomers + newCustomers - churnedCustomers;
    currentCustomers = Math.max(0, currentCustomers);

    // Calculate customer breakdown
    const monthProCustomers = Math.round(currentCustomers * (params.proPercent / 100));
    const monthBusinessCustomers = Math.round(currentCustomers * (params.businessPercent / 100));
    const monthProChatbotCustomers = Math.round(monthProCustomers * (params.proChatbotPercent / 100));
    const monthProNoChatbotCustomers = monthProCustomers - monthProChatbotCustomers;

    // Calculate revenue (EUR converted to USD)
    const proRevenue = monthProNoChatbotCustomers * params.proBasePrice;
    const proChatbotRevenue = monthProChatbotCustomers * (params.proBasePrice + params.chatbotAddonPrice);
    const extraCompanyRevenue = monthProCustomers * params.avgExtraCompaniesProUser * params.extraCompanyPrice;
    const businessRevenue = monthBusinessCustomers * params.businessBasePrice;
    const totalRevenueEUR = proRevenue + proChatbotRevenue + extraCompanyRevenue + businessRevenue;
    const totalRevenueUSD = totalRevenueEUR * EUR_USD_RATE;

    // Calculate costs
    const llmCosts = (monthProChatbotCustomers * llmCostPerUserMonth) +
      (monthBusinessCustomers * llmCostPerUserMonth * params.businessLlmMultiplier);
    const infraCosts = currentCustomers > 0 ? params.infraMonthlyCost : 0;
    const supportCosts = currentCustomers * supportCostPerCustomer;
    // Embedding costs: Pro chatbot users with their extra companies + Business users with more companies
    const embeddingCosts =
      (monthProChatbotCustomers * embeddingCostPerCompany * (1 + params.avgExtraCompaniesProUser)) +
      (monthBusinessCustomers * embeddingCostPerCompany * params.businessCompaniesMultiplier);
    const paymentFees = totalRevenueUSD * (params.paymentFeePercent / 100);
    const totalCosts = llmCosts + infraCosts + supportCosts + embeddingCosts + paymentFees;

    const profit = totalRevenueUSD - totalCosts;
    cumulativeProfit += profit;

    monthlyProjections.push({
      month,
      totalCustomers: currentCustomers,
      proCustomers: monthProCustomers,
      proChatbotCustomers: monthProChatbotCustomers,
      businessCustomers: monthBusinessCustomers,
      revenue: totalRevenueUSD,
      llmCosts,
      infraCosts,
      supportCosts,
      embeddingCosts,
      paymentFees,
      totalCosts,
      profit,
      cumulativeProfit,
    });
  }

  // Calculate totals
  const totalRevenue = monthlyProjections.reduce((sum, m) => sum + m.revenue, 0);
  const totalCosts = monthlyProjections.reduce((sum, m) => sum + m.totalCosts, 0);
  const totalProfit = totalRevenue - totalCosts;

  // Calculate averages
  const avgCustomers = monthlyProjections.reduce((sum, m) => sum + m.totalCustomers, 0) / params.projectionMonths;
  const averageRevenuePerCustomer = avgCustomers > 0 ? (totalRevenue / params.projectionMonths) / avgCustomers : 0;
  const averageCostPerCustomer = avgCustomers > 0 ? (totalCosts / params.projectionMonths) / avgCustomers : 0;
  const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

  return {
    // Per-customer costs
    proNoChatbotCost,
    proWithChatbotCost,
    businessCost,

    // Cost breakdown
    costBreakdown,

    // Margins
    proMargin,
    proChatbotMargin,
    businessMargin,

    // Break-even
    proBreakEven,
    proChatbotBreakEven,
    businessBreakEven,

    // Recommendations
    proRecommended,
    proChatbotRecommended,
    businessRecommended,

    // Projections
    monthlyProjections,
    totalRevenue,
    totalCosts,
    totalProfit,

    // Key metrics
    averageRevenuePerCustomer,
    averageCostPerCustomer,
    overallMargin,

    // LLM specific
    costPerMessage,
    tokensPerMessage,
    llmCostPerUserMonth,

    // First message overhead
    firstMessageOverheadCost,
    conversationsPerMonth,
  };
}

/**
 * Get default simulation parameters
 */
export function getDefaultParams(): SimulationParams {
  return {
    // Customer base
    totalCustomers: 100,
    proPercent: 80,
    businessPercent: 20,
    proChatbotPercent: 50,
    avgExtraCompaniesProUser: 0.5,

    // Usage patterns
    avgMessagesPerMonth: 500,
    avgInputTokens: 200,
    avgOutputTokens: 400,
    toolCallsPerMessage: 0.3,
    tokensPerToolCall: 100,

    // Content
    avgDocsPerCompany: 5,
    avgTokensPerDoc: 1000,
    embeddingCostPer1M: 0.02,

    // First message overhead
    firstMessageOverheadTokens: 1500, // System prompt tokens (base + docs + services)
    avgMessagesPerConversation: 5,    // Average messages per conversation

    // Growth & churn
    monthlyGrowthRate: 5,
    monthlyChurnRate: 3,
    projectionMonths: 12,

    // Operating costs
    infraMonthlyCost: 50,
    supportHoursPer100: 5,
    supportHourlyRate: 15,
    paymentFeePercent: 2.9,

    // Business tier multipliers
    businessLlmMultiplier: 1.5,
    businessInfraMultiplier: 1.2,
    businessSupportMultiplier: 0.8,
    businessCompaniesMultiplier: 3,

    // LLM pricing (GPT-4o defaults)
    selectedModelId: "",
    inputPricePer1M: 2.50,
    outputPricePer1M: 10.00,

    // Current pricing (EUR)
    proBasePrice: 10,
    chatbotAddonPrice: 10,
    extraCompanyPrice: 7,
    businessBasePrice: 99,
  };
}

/**
 * Format currency for display with thousands separators
 */
export function formatCurrency(amount: number, currency: "USD" | "EUR" = "USD"): string {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
