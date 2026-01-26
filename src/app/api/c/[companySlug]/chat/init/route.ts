import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/lib/db/tenant";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/chat/init
// Lightweight endpoint returning greeting + services for the chat widget.
// No auth required, no LLM cost.
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Fetch active services with the same fields as handleGetServices in tool-handlers.ts
    const services = await prisma.service.findMany({
      where: { companyId: company.id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        currency: true,
        color: true,
        discountType: true,
        discountValue: true,
        discountStartDate: true,
        discountEndDate: true,
        promotionalBadge: true,
        customBadgeLabel: true,
      },
      orderBy: { name: "asc" },
    });

    const uiServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      duration: s.duration,
      price: Number(s.price),
      currency: s.currency,
      color: s.color,
      discountType: s.discountType as "percentage" | "fixed" | null,
      discountValue: s.discountValue ? Number(s.discountValue) : null,
      discountStartDate: s.discountStartDate?.toISOString() ?? null,
      discountEndDate: s.discountEndDate?.toISOString() ?? null,
      promotionalBadge: s.promotionalBadge,
      customBadgeLabel: s.customBadgeLabel,
    }));

    return NextResponse.json(
      {
        greeting: company.aiGreeting || null,
        services: uiServices,
        language: company.language || "en",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Chat init error:", error);
    return NextResponse.json(
      { error: "Failed to load chat init data" },
      { status: 500 }
    );
  }
}
