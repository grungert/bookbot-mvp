import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Default pricing configs (used if database is empty or on error)
const DEFAULT_PRICING_CONFIGS = [
  { id: "default-1", key: "PRO_BASE", priceEurCents: 1000, description: "Pro plan base price", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
  { id: "default-2", key: "CHATBOT_ADDON", priceEurCents: 1000, description: "AI Chatbot add-on", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
  { id: "default-3", key: "EXTRA_COMPANY", priceEurCents: 700, description: "Price per extra company", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
  { id: "default-4", key: "BUSINESS_BASE", priceEurCents: 9900, description: "Business plan base price", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
];

// GET pricing configuration
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let pricingConfigs;
    try {
      pricingConfigs = await prisma.pricingConfig.findMany({
        orderBy: { key: "asc" },
      });
    } catch {
      // If PricingConfig model isn't available, return defaults
      console.log("PricingConfig not available, using defaults");
      pricingConfigs = DEFAULT_PRICING_CONFIGS;
    }

    // If no configs in database, return defaults
    if (!pricingConfigs || pricingConfigs.length === 0) {
      pricingConfigs = DEFAULT_PRICING_CONFIGS;
    }

    return NextResponse.json({ pricing: pricingConfigs });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

// PUT to update pricing configuration
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pricing } = body;

    if (!pricing || !Array.isArray(pricing)) {
      return NextResponse.json(
        { error: "Invalid pricing data" },
        { status: 400 }
      );
    }

    // Update each pricing item
    const updates = [];
    for (const item of pricing) {
      if (!item.key || typeof item.priceEurCents !== "number") {
        continue;
      }

      // Validate price is positive
      if (item.priceEurCents < 0) {
        return NextResponse.json(
          { error: `Invalid price for ${item.key}` },
          { status: 400 }
        );
      }

      updates.push(
        prisma.pricingConfig.upsert({
          where: { key: item.key },
          update: {
            priceEurCents: item.priceEurCents,
            description: item.description || null,
            isActive: item.isActive !== false,
            updatedBy: user.id,
          },
          create: {
            key: item.key,
            priceEurCents: item.priceEurCents,
            description: item.description || null,
            isActive: item.isActive !== false,
            updatedBy: user.id,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    // Fetch updated pricing
    const updatedPricing = await prisma.pricingConfig.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({
      success: true,
      pricing: updatedPricing,
    });
  } catch (error) {
    console.error("Error updating pricing:", error);
    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
