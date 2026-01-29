import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Default LLM pricing (used if database is empty)
const DEFAULT_LLM_PRICING = [
  { provider: "openai", modelName: "gpt-4o", displayName: "GPT-4o", inputPricePer1M: 2.50, outputPricePer1M: 10.00, isDefault: true, sortOrder: 1 },
  { provider: "openai", modelName: "gpt-4o-mini", displayName: "GPT-4o Mini", inputPricePer1M: 0.15, outputPricePer1M: 0.60, isDefault: false, sortOrder: 2 },
  { provider: "anthropic", modelName: "claude-sonnet-4", displayName: "Claude Sonnet 4", inputPricePer1M: 3.00, outputPricePer1M: 15.00, isDefault: false, sortOrder: 3 },
  { provider: "anthropic", modelName: "claude-haiku-3.5", displayName: "Claude Haiku 3.5", inputPricePer1M: 0.25, outputPricePer1M: 1.25, isDefault: false, sortOrder: 4 },
  { provider: "google", modelName: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", inputPricePer1M: 0.10, outputPricePer1M: 0.40, isDefault: false, sortOrder: 5 },
  { provider: "google", modelName: "gemini-1.5-pro", displayName: "Gemini 1.5 Pro", inputPricePer1M: 1.25, outputPricePer1M: 5.00, isDefault: false, sortOrder: 6 },
];

// GET all LLM pricing entries
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let llmPricing;
    try {
      llmPricing = await prisma.lLMModelPricing.findMany({
        orderBy: [{ sortOrder: "asc" }, { provider: "asc" }],
      });
    } catch {
      console.log("LLMModelPricing not available, using defaults");
      return NextResponse.json({ llmPricing: DEFAULT_LLM_PRICING.map((p, i) => ({ ...p, id: `default-${i}`, isActive: true })) });
    }

    // If no entries in database, seed with defaults and return
    if (!llmPricing || llmPricing.length === 0) {
      try {
        await prisma.lLMModelPricing.createMany({
          data: DEFAULT_LLM_PRICING.map((p) => ({
            ...p,
            isActive: true,
          })),
        });
        llmPricing = await prisma.lLMModelPricing.findMany({
          orderBy: [{ sortOrder: "asc" }, { provider: "asc" }],
        });
      } catch {
        return NextResponse.json({ llmPricing: DEFAULT_LLM_PRICING.map((p, i) => ({ ...p, id: `default-${i}`, isActive: true })) });
      }
    }

    return NextResponse.json({ llmPricing });
  } catch (error) {
    console.error("Error fetching LLM pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch LLM pricing" },
      { status: 500 }
    );
  }
}

// POST to create a new LLM pricing entry
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, modelName, displayName, inputPricePer1M, outputPricePer1M, isDefault, sortOrder } = body;

    // Validation
    if (!provider || !modelName || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields: provider, modelName, displayName" },
        { status: 400 }
      );
    }

    if (typeof inputPricePer1M !== "number" || typeof outputPricePer1M !== "number") {
      return NextResponse.json(
        { error: "inputPricePer1M and outputPricePer1M must be numbers" },
        { status: 400 }
      );
    }

    if (inputPricePer1M < 0 || outputPricePer1M < 0) {
      return NextResponse.json(
        { error: "Prices cannot be negative" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.lLMModelPricing.findUnique({
      where: { provider_modelName: { provider, modelName } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A model with this provider and name already exists" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.lLMModelPricing.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const newPricing = await prisma.lLMModelPricing.create({
      data: {
        provider,
        modelName,
        displayName,
        inputPricePer1M,
        outputPricePer1M,
        isDefault: isDefault ?? false,
        isActive: true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, llmPricing: newPricing });
  } catch (error) {
    console.error("Error creating LLM pricing:", error);
    return NextResponse.json(
      { error: "Failed to create LLM pricing" },
      { status: 500 }
    );
  }
}

// PUT to update an existing LLM pricing entry
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
    const { id, provider, modelName, displayName, inputPricePer1M, outputPricePer1M, isDefault, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Validation
    if (inputPricePer1M !== undefined && inputPricePer1M < 0) {
      return NextResponse.json(
        { error: "inputPricePer1M cannot be negative" },
        { status: 400 }
      );
    }

    if (outputPricePer1M !== undefined && outputPricePer1M < 0) {
      return NextResponse.json(
        { error: "outputPricePer1M cannot be negative" },
        { status: 400 }
      );
    }

    // Check if entry exists
    const existing = await prisma.lLMModelPricing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "LLM pricing entry not found" },
        { status: 404 }
      );
    }

    // If changing provider+modelName, check for duplicate
    if ((provider && provider !== existing.provider) || (modelName && modelName !== existing.modelName)) {
      const duplicate = await prisma.lLMModelPricing.findUnique({
        where: { provider_modelName: { provider: provider ?? existing.provider, modelName: modelName ?? existing.modelName } },
      });

      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { error: "A model with this provider and name already exists" },
          { status: 400 }
        );
      }
    }

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await prisma.lLMModelPricing.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.lLMModelPricing.update({
      where: { id },
      data: {
        ...(provider !== undefined && { provider }),
        ...(modelName !== undefined && { modelName }),
        ...(displayName !== undefined && { displayName }),
        ...(inputPricePer1M !== undefined && { inputPricePer1M }),
        ...(outputPricePer1M !== undefined && { outputPricePer1M }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, llmPricing: updated });
  } catch (error) {
    console.error("Error updating LLM pricing:", error);
    return NextResponse.json(
      { error: "Failed to update LLM pricing" },
      { status: 500 }
    );
  }
}

// DELETE an LLM pricing entry
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    // Check if entry exists
    const existing = await prisma.lLMModelPricing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "LLM pricing entry not found" },
        { status: 404 }
      );
    }

    await prisma.lLMModelPricing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting LLM pricing:", error);
    return NextResponse.json(
      { error: "Failed to delete LLM pricing" },
      { status: 500 }
    );
  }
}
