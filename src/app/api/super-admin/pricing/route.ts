import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING } from "@/lib/constants/pricing";

// Default pricing configs (used if database is empty or on error)
const DEFAULT_PRICING_CONFIGS = [
  { id: "default-1", key: "PRO_BASE", priceEurCents: DEFAULT_PRICING.PRO_BASE, description: "Pro plan base price", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
  { id: "default-2", key: "CHATBOT_ADDON", priceEurCents: DEFAULT_PRICING.CHATBOT_ADDON, description: "AI Chatbot add-on", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
  { id: "default-3", key: "EXTRA_COMPANY", priceEurCents: DEFAULT_PRICING.EXTRA_COMPANY, description: "Price per extra company", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
  { id: "default-4", key: "BUSINESS_BASE", priceEurCents: DEFAULT_PRICING.BUSINESS_BASE, description: "Business plan base price", isActive: true, updatedAt: new Date().toISOString(), updatedBy: null },
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

    // Fetch token packs
    let tokenPacks: { id: string; name: string; tokenAmount: number; priceEurCents: number; isActive: boolean; sortOrder: number }[] = [];
    try {
      tokenPacks = await prisma.tokenPack.findMany({
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      console.log("TokenPack model not available");
    }

    return NextResponse.json({ pricing: pricingConfigs, tokenPacks });
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
    const { pricing, tokenPacks } = body;

    if (!pricing || !Array.isArray(pricing)) {
      return NextResponse.json(
        { error: "Invalid pricing data" },
        { status: 400 }
      );
    }

    // Validate all pricing items first before making any changes
    const validationErrors: string[] = [];
    const validItems: typeof pricing = [];

    for (const item of pricing) {
      if (!item.key || typeof item.priceEurCents !== "number") {
        validationErrors.push(`Invalid item: missing key or priceEurCents (${JSON.stringify(item)})`);
        continue;
      }

      // Validate price is positive and non-zero (#15)
      if (item.priceEurCents <= 0) {
        validationErrors.push(`Invalid price for ${item.key}: price must be greater than zero`);
        continue;
      }

      validItems.push(item);
    }

    // If there are validation errors, return them all
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed for some pricing items",
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Update each pricing item
    const updates = validItems.map((item) =>
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

    await prisma.$transaction(updates);

    // Update token packs if provided
    if (tokenPacks && Array.isArray(tokenPacks)) {
      // Validate all token packs first
      const tokenPackErrors: string[] = [];
      const validTokenPacks: typeof tokenPacks = [];

      for (const pack of tokenPacks) {
        if (!pack.name || typeof pack.tokenAmount !== "number" || typeof pack.priceEurCents !== "number") {
          tokenPackErrors.push(`Invalid token pack: missing name, tokenAmount, or priceEurCents (${JSON.stringify(pack)})`);
          continue;
        }

        // Validate values
        if (pack.priceEurCents < 0 || pack.tokenAmount < 0) {
          tokenPackErrors.push(`Invalid values for token pack "${pack.name}": values cannot be negative`);
          continue;
        }

        validTokenPacks.push(pack);
      }

      // If there are validation errors, return them all
      if (tokenPackErrors.length > 0) {
        return NextResponse.json(
          {
            error: "Validation failed for some token packs",
            details: tokenPackErrors
          },
          { status: 400 }
        );
      }

      // Get existing pack IDs to determine which ones to delete
      const existingPacks = await prisma.tokenPack.findMany({
        select: { id: true },
      });
      const existingIds = new Set(existingPacks.map((p) => p.id));
      const incomingIds = new Set(
        validTokenPacks.filter((p) => p.id && !p.id.startsWith("new-")).map((p) => p.id)
      );

      // Delete packs that were removed
      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
      if (toDelete.length > 0) {
        await prisma.tokenPack.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Upsert each token pack
      for (const pack of validTokenPacks) {
        if (pack.id && !pack.id.startsWith("new-")) {
          // Update existing pack
          await prisma.tokenPack.update({
            where: { id: pack.id },
            data: {
              name: pack.name,
              tokenAmount: pack.tokenAmount,
              priceEurCents: pack.priceEurCents,
              isActive: pack.isActive !== false,
              sortOrder: pack.sortOrder ?? 0,
            },
          });
        } else {
          // Create new pack
          await prisma.tokenPack.create({
            data: {
              name: pack.name,
              tokenAmount: pack.tokenAmount,
              priceEurCents: pack.priceEurCents,
              isActive: pack.isActive !== false,
              sortOrder: pack.sortOrder ?? 0,
            },
          });
        }
      }
    }

    // Fetch updated pricing and token packs
    const [updatedPricing, updatedTokenPacks] = await Promise.all([
      prisma.pricingConfig.findMany({ orderBy: { key: "asc" } }),
      prisma.tokenPack.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({
      success: true,
      pricing: updatedPricing,
      tokenPacks: updatedTokenPacks,
    });
  } catch (error) {
    console.error("Error updating pricing:", error);
    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
