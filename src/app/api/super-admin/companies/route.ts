import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  timezone: z.string().optional(),
  primaryColor: z.string().optional(),
});

// GET /api/super-admin/companies
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            services: true,
            appointments: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/companies
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existing = await prisma.company.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Company slug already exists" },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug.toLowerCase(),
        description: parsed.data.description,
        timezone: parsed.data.timezone || "Europe/Belgrade",
        primaryColor: parsed.data.primaryColor || "#3B82F6",
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
