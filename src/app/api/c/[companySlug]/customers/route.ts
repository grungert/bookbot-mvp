import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

/**
 * GET /api/c/[companySlug]/customers
 * Returns distinct customers who have either:
 * - Made appointments with this company
 * - Been billed (have invoices) by this company
 *
 * This is more efficient than loading all appointments just to extract unique users.
 */
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

    // Get distinct user IDs from both appointments and invoices
    const [appointmentUserIds, invoiceUserIds] = await Promise.all([
      prisma.appointment.findMany({
        where: { companyId: company.id },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.invoice.findMany({
        where: { companyId: company.id },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    // Combine and deduplicate user IDs
    const allUserIds = new Set([
      ...appointmentUserIds.map((a) => a.userId),
      ...invoiceUserIds.map((i) => i.userId),
    ]);

    if (allUserIds.size === 0) {
      return NextResponse.json({ customers: [] });
    }

    // Fetch user details
    const customers = await prisma.user.findMany({
      where: {
        id: { in: Array.from(allUserIds) },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
      orderBy: [
        { name: "asc" },
        { email: "asc" },
      ],
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
