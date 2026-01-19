import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess, getCompanyBySlug } from "@/lib/db/tenant";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().min(5).max(480),
  price: z.number().min(0),
  currency: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  // Discount fields
  discountType: z.enum(["percentage", "fixed"]).nullable().optional(),
  discountValue: z.number().min(0).nullable().optional(),
  discountStartDate: z.string().datetime().nullable().optional(),
  discountEndDate: z.string().datetime().nullable().optional(),
  promotionalBadge: z.enum(["SALE", "NEW", "POPULAR", "HOT"]).nullable().optional(),
  customBadgeLabel: z.string().max(20).nullable().optional(),
}).refine((data) => {
  // If discount type is percentage, value must be 0-100
  if (data.discountType === "percentage" && data.discountValue != null) {
    return data.discountValue >= 0 && data.discountValue <= 100;
  }
  return true;
}, {
  message: "Percentage discount must be between 0 and 100",
  path: ["discountValue"],
}).refine((data) => {
  // If discount type is fixed, value must be less than or equal to price
  if (data.discountType === "fixed" && data.discountValue != null) {
    return data.discountValue <= data.price;
  }
  return true;
}, {
  message: "Fixed discount cannot exceed the service price",
  path: ["discountValue"],
}).refine((data) => {
  // End date must be after start date
  if (data.discountStartDate && data.discountEndDate) {
    return new Date(data.discountEndDate) > new Date(data.discountStartDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["discountEndDate"],
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/services - List all services
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const services = await prisma.service.findMany({
      where: {
        companyId: company.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/c/[companySlug]/services - Create a service
export async function POST(request: Request, { params }: RouteParams) {
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
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        companyId: company.id,
        name: parsed.data.name,
        description: parsed.data.description,
        duration: parsed.data.duration,
        price: parsed.data.price,
        currency: parsed.data.currency || company.currency,
        color: parsed.data.color,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        discountStartDate: parsed.data.discountStartDate ? new Date(parsed.data.discountStartDate) : null,
        discountEndDate: parsed.data.discountEndDate ? new Date(parsed.data.discountEndDate) : null,
        promotionalBadge: parsed.data.promotionalBadge,
        customBadgeLabel: parsed.data.customBadgeLabel,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
