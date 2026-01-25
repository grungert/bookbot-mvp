import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { logAuditEvent, getClientIp, getUserAgent, computeChanges } from "@/lib/db/audit";
import { sendInvoiceSentEmail, sendInvoicePaidEmail } from "@/lib/email/send";
import { z } from "zod";
import { addDays } from "date-fns";

const updateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).optional(),
  userId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
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

    // Check if user has admin access to this company (via membership)
    const membership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });
    const isCompanyAdmin = user.role === "SUPER_ADMIN" || !!membership;

    // Non-admin users can only see their own invoices
    if (!isCompanyAdmin && invoice.userId !== user.id) {
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

    const { lineItems, userId, dueDate, ...restData } = parsed.data;

    // Build update data
    const updateData: Record<string, unknown> = {
      ...restData,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(userId && { userId }),
    };

    // Set paidAt when status changes to PAID
    if (parsed.data.status === "PAID" && invoice.status !== "PAID") {
      updateData.paidAt = new Date();
    }
    // Clear paidAt if status changes from PAID to something else
    if (parsed.data.status && parsed.data.status !== "PAID" && invoice.status === "PAID") {
      updateData.paidAt = null;
    }

    // If lineItems are provided, delete existing and recreate
    if (lineItems && lineItems.length > 0) {
      // Delete existing line items
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId },
      });

      // Calculate new totals
      const subtotal = lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const tax = 0; // Tax can be calculated if needed
      const total = subtotal + tax;

      // Create new line items
      await prisma.invoiceLineItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      });

      // Add totals to update data
      updateData.subtotal = subtotal;
      updateData.tax = tax;
      updateData.total = total;
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
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

    // Log audit event
    const { user: adminUser } = await validateCompanyAdminAccess(companySlug);
    if (adminUser) {
      const changes = computeChanges(
        { status: invoice.status, notes: invoice.notes },
        { status: parsed.data.status, notes: parsed.data.notes },
        ["status", "notes"]
      );

      if (changes) {
        await logAuditEvent({
          companyId: company.id,
          userId: adminUser.id,
          action: "UPDATE",
          entityType: "Invoice",
          entityId: invoiceId,
          changes,
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
        });
      }
    }

    // Send email notifications on status changes
    if (updated.user.email) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";

      // Send invoice email when status changes to SENT
      if (parsed.data.status === "SENT" && invoice.status !== "SENT") {
        try {
          const dueDate = updated.dueDate || addDays(updated.issueDate, 30);
          await sendInvoiceSentEmail({
            customerEmail: updated.user.email,
            customerName: updated.user.name || "Customer",
            invoiceNumber: updated.invoiceNumber,
            issueDate: updated.issueDate,
            dueDate,
            total: Number(updated.total),
            currency: updated.currency,
            companyName: company.name,
            invoiceUrl: `${baseUrl}/en/c/${companySlug}/invoices/${invoiceId}`,
          });
        } catch (error) {
          console.error("[EMAIL] Failed to send invoice sent email:", error);
        }
      }

      // Send payment confirmation when status changes to PAID
      if (parsed.data.status === "PAID" && invoice.status !== "PAID") {
        try {
          await sendInvoicePaidEmail({
            customerEmail: updated.user.email,
            customerName: updated.user.name || "Customer",
            invoiceNumber: updated.invoiceNumber,
            paidDate: updated.paidAt || new Date(),
            total: Number(updated.total),
            currency: updated.currency,
            companyName: company.name,
          });
        } catch (error) {
          console.error("[EMAIL] Failed to send invoice paid email:", error);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/c/[companySlug]/invoices/[invoiceId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, invoiceId } = await params;
    const { error, company, user } = await validateCompanyAdminAccess(companySlug);

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

    // Delete the invoice (line items will be cascade deleted due to onDelete: Cascade)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    // Log audit event
    if (user) {
      await logAuditEvent({
        companyId: company.id,
        userId: user.id,
        action: "DELETE",
        entityType: "Invoice",
        entityId: invoiceId,
        changes: {
          invoiceNumber: { old: invoice.invoiceNumber },
          status: { old: invoice.status },
          total: { old: Number(invoice.total) },
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
