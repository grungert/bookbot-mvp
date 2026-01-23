import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Default pricing in EUR cents (used if database is empty)
const DEFAULT_PRICING: Record<string, number> = {
  PRO_BASE: 1000,       // €10/month
  CHATBOT_ADDON: 1000,  // €10/month
  EXTRA_COMPANY: 700,   // €7/month
  BUSINESS_BASE: 9900,  // €99/month
};

// Public endpoint to fetch current pricing configuration
export async function GET() {
  try {
    const pricingConfigs = await prisma.pricingConfig.findMany({
      where: { isActive: true },
      select: {
        key: true,
        priceEurCents: true,
        description: true,
      },
    });

    // Transform array into an object for easy access
    const pricing: Record<string, number> = { ...DEFAULT_PRICING };
    const descriptions: Record<string, string> = {};

    for (const config of pricingConfigs) {
      pricing[config.key] = config.priceEurCents;
      if (config.description) {
        descriptions[config.key] = config.description;
      }
    }

    return NextResponse.json({
      pricing,
      descriptions,
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    // Return default pricing on error
    return NextResponse.json({
      pricing: DEFAULT_PRICING,
      descriptions: {},
    });
  }
}
