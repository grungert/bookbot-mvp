import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";

const updateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string; invoiceId: string }>;
}

// GET /api/c/[companySlug]/invoices/[invoiceId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, invoiceId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: company.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        lineItems: true,
        appointment: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only see their own invoices
    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "COMPANY_ADMIN" &&
      invoice.userId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/invoices/[invoiceId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, invoiceId } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: company.id,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate
          ? new Date(parsed.data.dueDate)
          : undefined,
      },
      include: {
        lineItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
