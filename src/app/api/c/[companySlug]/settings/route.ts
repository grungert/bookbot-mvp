import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess, getCompanyBySlug } from "@/lib/db/tenant";
import { z } from "zod";

const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  timezone: z.string().optional(),
  aiApiKey: z.string().nullable().optional(),
  aiEndpoint: z.string().nullable().optional(),
  aiModel: z.string().nullable().optional(),
  aiSystemPrompt: z.string().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/settings - Get company settings
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    // Return settings without exposing the full API key
    const settings = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      logoUrl: company.logoUrl,
      primaryColor: company.primaryColor,
      timezone: company.timezone,
      // Mask API key - only show last 4 chars if exists
      aiApiKey: company.aiApiKey
        ? `***${company.aiApiKey.slice(-4)}`
        : null,
      hasAiApiKey: !!company.aiApiKey,
      aiEndpoint: company.aiEndpoint,
      aiModel: company.aiModel,
      aiSystemPrompt: company.aiSystemPrompt,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/settings - Update company settings
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build update object, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.aiEndpoint !== undefined) updateData.aiEndpoint = data.aiEndpoint;
    if (data.aiModel !== undefined) updateData.aiModel = data.aiModel;
    if (data.aiSystemPrompt !== undefined) updateData.aiSystemPrompt = data.aiSystemPrompt;

    // Only update API key if a new one is provided (not masked value)
    if (data.aiApiKey !== undefined && !data.aiApiKey?.startsWith("***")) {
      updateData.aiApiKey = data.aiApiKey;
    }

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: updateData,
    });

    // Return updated settings without exposing full API key
    const settings = {
      id: updatedCompany.id,
      name: updatedCompany.name,
      slug: updatedCompany.slug,
      description: updatedCompany.description,
      logoUrl: updatedCompany.logoUrl,
      primaryColor: updatedCompany.primaryColor,
      timezone: updatedCompany.timezone,
      aiApiKey: updatedCompany.aiApiKey
        ? `***${updatedCompany.aiApiKey.slice(-4)}`
        : null,
      hasAiApiKey: !!updatedCompany.aiApiKey,
      aiEndpoint: updatedCompany.aiEndpoint,
      aiModel: updatedCompany.aiModel,
      aiSystemPrompt: updatedCompany.aiSystemPrompt,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
