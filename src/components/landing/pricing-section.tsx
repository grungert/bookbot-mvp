"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Coins } from "lucide-react";
import { PricingCard } from "./pricing-card";
import { ScrollReveal } from "./scroll-reveal";
import type { PublicPlan } from "@/app/api/plans/route";
import type { PricingConfig, TokenPack } from "@/app/[locale]/page";

interface PricingSectionProps {
  plans: PublicPlan[];
  pricing: PricingConfig;
  tokenPacks: TokenPack[];
}

// Format token count for display (e.g., 50000 -> "50K", 1000000 -> "1M")
function formatTokens(tokens: number): string {
  if (tokens === -1) return "Unlimited";
  if (tokens >= 1000000) return `${tokens / 1000000}M`;
  if (tokens >= 1000) return `${tokens / 1000}K`;
  return tokens.toString();
}

// Format EUR cents to display price
function formatEurPrice(cents: number): string {
  const euros = cents / 100;
  return euros % 1 === 0 ? `€${euros}` : `€${euros.toFixed(2)}`;
}

// Generate features list from plan data
function generateFeatures(
  plan: PublicPlan,
  pricing: PricingConfig
): string[] {
  const features: string[] = [];

  // For PRO plan, show company limit with extra company price from PricingConfig
  if (plan.tier === "PRO") {
    const extraPrice = formatEurPrice(pricing.EXTRA_COMPANY);
    features.push(`${plan.baseCompanies} company (+${extraPrice}/extra)`);
  } else if (plan.maxCompanies === -1) {
    features.push("Unlimited companies");
  } else {
    features.push(`${plan.baseCompanies} company${plan.baseCompanies > 1 ? "ies" : ""}`);
  }

  // Token limit
  features.push(`${formatTokens(plan.maxChatTokensPerMonth)} tokens/month`);

  // Document limit
  if (plan.maxDocumentsPerCompany === -1 || plan.maxDocumentsPerCompany === null) {
    features.push("Unlimited documents");
  } else {
    features.push(`${plan.maxDocumentsPerCompany} documents per company`);
  }

  // Custom branding
  if (plan.customBranding) {
    features.push("Custom branding");
  }

  // Priority support
  if (plan.prioritySupport) {
    features.push("Priority support");
  }

  // All plans get unlimited services
  features.push("Unlimited services");

  return features;
}

// Determine which plan is "popular" (PRO tier by default)
function isPopularPlan(tier: string): boolean {
  return tier === "PRO";
}

export function PricingSection({ plans, pricing, tokenPacks }: PricingSectionProps) {
  const t = useTranslations("landing");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("pricingTitle")}
          </h2>
          <p
            className="text-xl text-foreground/80 max-w-2xl mx-auto"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
            }}
          >
            {t("pricingSubtitle")}
          </p>
        </ScrollReveal>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => {
            const isPopular = isPopularPlan(plan.tier);
            const isPro = plan.tier === "PRO";

            // Build price display
            let priceDisplay: string;
            let priceDetail: string;
            let pricingOptions;

            if (plan.trialDays) {
              // Trial plan
              priceDisplay = "Free";
              priceDetail = `for ${plan.trialDays} days`;
            } else if (isPro) {
              // Pro plan: show pricing options
              priceDisplay = "";
              priceDetail = "";
              pricingOptions = [
                {
                  label: "Without AI",
                  price: formatEurPrice(pricing.PRO_BASE),
                  highlight: false,
                },
                {
                  label: "With AI Chatbot",
                  price: formatEurPrice(pricing.PRO_BASE + pricing.CHATBOT_ADDON),
                  highlight: true,
                },
              ];
            } else {
              // Business plan
              priceDisplay = formatEurPrice(pricing.BUSINESS_BASE);
              priceDetail = "/month";
            }

            return (
              <PricingCard
                key={plan.id}
                name={plan.name}
                price={priceDisplay}
                priceDetail={priceDetail}
                features={generateFeatures(plan, pricing)}
                isPopular={isPopular}
                popularLabel={isPopular ? t("mostPopular") : undefined}
                ctaText={t("choosePlan")}
                delay={index * 0.1}
                index={index}
                pricingOptions={pricingOptions}
              />
            );
          })}
        </div>

        {/* Token Packs Section */}
        {tokenPacks.length > 0 && (
          <div className="mt-20">
            <ScrollReveal className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Coins className="h-6 w-6 text-purple-500" />
                <h3
                  className="text-2xl md:text-3xl font-bold"
                  style={{
                    textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
                  }}
                >
                  Need More Tokens?
                </h3>
              </div>
              <p
                className="text-foreground/70 max-w-xl mx-auto"
                style={{
                  textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
                }}
              >
                Purchase additional tokens anytime to power your AI chatbot
              </p>
            </ScrollReveal>

            {/* Token Pack Cards */}
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {tokenPacks.map((pack, index) => {
                const pricePerToken = (pack.priceEurCents / pack.tokenAmount * 1000).toFixed(3);
                const isMiddle = index === 1;

                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.4,
                      delay: prefersReducedMotion ? 0 : 0.1 + index * 0.1,
                    }}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -4 }}
                    className={`
                      relative rounded-xl p-5 min-w-[200px] flex-1 max-w-[260px]
                      bg-white/60 dark:bg-gray-900/60
                      backdrop-blur-md
                      border border-white/20 dark:border-white/10
                      shadow-lg shadow-black/5
                      ${isMiddle ? 'ring-2 ring-purple-500/30' : ''}
                    `}
                  >
                    {isMiddle && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium px-3 py-0.5 rounded-full">
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        {pack.name}
                      </h4>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatTokens(pack.tokenAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        tokens
                      </div>
                      <div className="text-xl font-bold">
                        {formatEurPrice(pack.priceEurCents)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        €{pricePerToken}/1K tokens
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
