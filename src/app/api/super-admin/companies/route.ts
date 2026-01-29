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
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add pagination support (#11)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search");

    // Validate search term length
    if (search && search.length > 100) {
      return NextResponse.json({ error: "Search term too long" }, { status: 400 });
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.company.count({ where });

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            services: true,
            appointments: true,
            invoices: true,
          },
        },
        memberships: {
          where: { role: "OWNER" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
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

    // Default working hours for all 7 days
    const defaultWorkingHours = [
      { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isOpen: false }, // Sunday
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isOpen: true }, // Monday
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isOpen: true }, // Tuesday
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isOpen: true }, // Wednesday
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isOpen: true }, // Thursday
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isOpen: true }, // Friday
      { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isOpen: false }, // Saturday
    ];

    // Create company and working hours in a transaction
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug.toLowerCase(),
          description: parsed.data.description,
          timezone: parsed.data.timezone || "Europe/Belgrade",
          primaryColor: parsed.data.primaryColor || "#3B82F6",
        },
      });

      // Seed all 7 working hours for the new company
      await tx.workingHours.createMany({
        data: defaultWorkingHours.map((wh) => ({
          companyId: newCompany.id,
          ...wh,
        })),
      });

      return newCompany;
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
