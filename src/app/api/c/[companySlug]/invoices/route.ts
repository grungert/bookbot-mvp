import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";
import { InvoiceStatus, Prisma } from "@prisma/client";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

const createInvoiceSchema = z.object({
  userId: z.string(),
  appointmentId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// Generate invoice number
async function generateInvoiceNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      companyId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

// GET /api/c/[companySlug]/invoices
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.InvoiceWhereInput = {
      companyId: company.id,
    };

    // Non-admin users can only see their own invoices
    if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
      where.userId = user.id;
    }

    if (status) {
      where.status = status as InvoiceStatus;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: true,
        appointment: {
          select: {
            id: true,
            startTime: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/c/[companySlug]/invoices
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
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, appointmentId, dueDate, notes, lineItems } = parsed.data;

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = subtotal * 0.2; // 20% tax (typical VAT)
    const total = subtotal + tax;

    const invoiceNumber = await generateInvoiceNumber(company.id);

    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        userId,
        appointmentId: appointmentId || null,
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        subtotal,
        tax,
        total,
        lineItems: {
          create: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
