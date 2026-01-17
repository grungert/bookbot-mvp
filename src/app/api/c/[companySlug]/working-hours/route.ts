import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";

const workingHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    isOpen: z.boolean(),
  })
);

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/working-hours
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

    const workingHours = await prisma.workingHours.findMany({
      where: { companyId: company.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(workingHours);
  } catch (error) {
    console.error("Error fetching working hours:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/c/[companySlug]/working-hours - Replace all working hours
export async function PUT(request: Request, { params }: RouteParams) {
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
    const parsed = workingHoursSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Delete existing and create new working hours in a transaction
    const workingHours = await prisma.$transaction(async (tx) => {
      await tx.workingHours.deleteMany({
        where: { companyId: company.id },
      });

      return tx.workingHours.createManyAndReturn({
        data: parsed.data.map((wh) => ({
          companyId: company.id,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
          isOpen: wh.isOpen,
        })),
      });
    });

    return NextResponse.json(workingHours);
  } catch (error) {
    console.error("Error updating working hours:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
