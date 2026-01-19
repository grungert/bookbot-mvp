import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkCanCreateCompany } from "@/lib/db/tenant";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  slug: z.string().min(1, "URL slug is required").max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  timezone: z.string().default("Europe/Belgrade"),
  currency: z.string().default("RSD"),
});

// POST /api/companies - Create a new company
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only COMPANY_ADMIN and SUPER_ADMIN can create companies
    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can create companies" },
        { status: 403 }
      );
    }

    // Check if user can create more companies
    const canCreate = await checkCanCreateCompany(session.user.id);
    if (!canCreate.allowed) {
      return NextResponse.json(
        {
          error: canCreate.reason,
          currentCount: canCreate.currentCount,
          maxCount: canCreate.maxCount,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, timezone, currency } = parsed.data;

    // Check if slug is already taken
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "This URL slug is already taken" },
        { status: 409 }
      );
    }

    // Create company and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company
      const company = await tx.company.create({
        data: {
          name,
          slug: slug.toLowerCase(),
          timezone,
          currency,
        },
      });

      // Create membership with OWNER role
      await tx.companyMembership.create({
        data: {
          userId: session.user.id,
          companyId: company.id,
          role: "OWNER",
          isPrimary: canCreate.currentCount === 0, // First company is primary
        },
      });

      // Create default working hours (Monday-Friday 9-17)
      const defaultWorkingHours = [];
      for (let day = 0; day < 7; day++) {
        defaultWorkingHours.push({
          companyId: company.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isOpen: day >= 1 && day <= 5, // Monday-Friday open
        });
      }

      await tx.workingHours.createMany({
        data: defaultWorkingHours,
      });

      return company;
    });

    return NextResponse.json({
      company: {
        id: result.id,
        slug: result.slug,
        name: result.name,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
