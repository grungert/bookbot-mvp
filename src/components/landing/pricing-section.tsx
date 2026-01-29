"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, MessageCircle, Globe, Smartphone, ArrowRight } from "lucide-react";
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

// WhatsApp Integration Banner Component
function WhatsAppIntegrationBanner() {
  const prefersReducedMotion = useReducedMotion();

  const channels = [
    {
      icon: MessageCircle,
      name: "WhatsApp Business",
      description: "Connect with customers on their favorite messaging app",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      icon: Globe,
      name: "Website Widget",
      description: "Embed AI chatbot directly on your website",
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      icon: Smartphone,
      name: "Mobile Friendly",
      description: "Seamless experience on any device",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="mt-16">
      <ScrollReveal className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-4">
          <MessageCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Included with AI Chatbot
          </span>
        </div>
        <h3
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{
            textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
          }}
        >
          Multi-Channel AI Support
        </h3>
        <p
          className="text-foreground/70 max-w-xl mx-auto"
          style={{
            textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
          }}
        >
          Your AI assistant works everywhere your customers are
        </p>
      </ScrollReveal>

      {/* Channel Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {channels.map((channel, index) => (
          <motion.div
            key={channel.name}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: prefersReducedMotion ? 0 : 0.1 + index * 0.1,
            }}
            whileHover={prefersReducedMotion ? {} : { scale: 1.03, y: -4 }}
            className="group relative"
          >
            {/* Card */}
            <div className="relative rounded-2xl p-6 h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg overflow-hidden">
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${channel.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl ${channel.bgColor} mb-4`}>
                <channel.icon className={`h-6 w-6 ${channel.iconColor}`} />
              </div>

              {/* Content */}
              <h4 className="font-semibold text-lg mb-2">{channel.name}</h4>
              <p className="text-sm text-muted-foreground">{channel.description}</p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={channel.iconColor}>Learn more</span>
                <ArrowRight className={`h-4 w-4 ${channel.iconColor} group-hover:translate-x-1 transition-transform`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* WhatsApp Highlight Banner */}
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.5,
          delay: prefersReducedMotion ? 0 : 0.4,
        }}
        className="mt-8 max-w-4xl mx-auto"
      >
        <div className="relative rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-green-500/20 dark:border-green-500/10 shadow-lg shadow-green-500/5">
          {/* Green gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10 pointer-events-none" />

          {/* Content */}
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            {/* WhatsApp Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-xl font-bold mb-2">
                WhatsApp Business Integration
              </h4>
              <p className="text-muted-foreground">
                Let customers book appointments, ask questions, and get support directly through WhatsApp.
                Your AI assistant handles conversations 24/7, speaking your brand's voice.
              </p>
            </div>

            {/* Badge */}
            <div className="flex-shrink-0">
              <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Pro + AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
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

        {/* WhatsApp Integration Section */}
        <WhatsAppIntegrationBanner />

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
