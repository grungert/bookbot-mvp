/**
 * Default pricing constants for the subscription system.
 * These are used as fallbacks when pricing is not available from the database.
 * All prices are in EUR cents.
 */

export const DEFAULT_PRICING = {
  /** Pro plan base price in cents (€10.00) */
  PRO_BASE: 1000,
  /** AI Chatbot add-on price in cents (€10.00) */
  CHATBOT_ADDON: 1000,
  /** Extra company slot price in cents (€7.00) */
  EXTRA_COMPANY: 700,
  /** Business plan base price in cents (€99.00) */
  BUSINESS_BASE: 9900,
} as const;

export type PricingKey = keyof typeof DEFAULT_PRICING;

/**
 * Subscription system constants
 */
export const SUBSCRIPTION_CONSTANTS = {
  /** Number of days before trial expiry to show warning (#20) */
  TRIAL_EXPIRY_WARNING_DAYS: 7,
} as const;
