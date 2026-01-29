import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/db/audit";
import { z } from "zod";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { calculateDiscountedPrice } from "@/lib/utils/discount";

const lineItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  // Discount fields (optional, populated when serviceId is provided)
  originalUnitPrice: z.number().optional(),
  discountType: z.string().optional(),
  discountValue: z.number().optional(),
  discountPercentage: z.number().optional(),
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
    const serviceIds = searchParams.get("serviceIds"); // Comma-separated service IDs
    const customerId = searchParams.get("customerId"); // Filter by customer/user ID
    const search = searchParams.get("search"); // Search by invoice number
    const all = searchParams.get("all") === "true"; // Return all without pagination

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

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

    const where: Prisma.InvoiceWhereInput = {
      companyId: company.id,
    };

    // Non-admin users can only see their own invoices
    if (!isCompanyAdmin) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status as InvoiceStatus;
    }

    // Filter by customer (admin only)
    if (customerId && isCompanyAdmin) {
      where.userId = customerId;
    }

    // Search by invoice number (case-insensitive partial match)
    if (search) {
      where.invoiceNumber = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };
    }

    // Filter by services (invoices containing any of the specified services)
    if (serviceIds) {
      const serviceIdArray = serviceIds.split(",").filter(Boolean);
      if (serviceIdArray.length > 0) {
        where.lineItems = {
          some: {
            serviceId: {
              in: serviceIdArray,
            },
          },
        };
      }
    }

    const includeConfig = {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
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
    };

    // For backwards compatibility, return all invoices without pagination when all=true
    if (all) {
      const invoices = await prisma.invoice.findMany({
        where,
        include: includeConfig,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(invoices);
    }

    // Get total count for pagination
    const total = await prisma.invoice.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const invoices = await prisma.invoice.findMany({
      where,
      include: includeConfig,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      invoices,
      total,
      page,
      limit,
      totalPages,
    });
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

    // Batch fetch all services referenced in line items to avoid N+1 queries
    const serviceIds = lineItems
      .map((item) => item.serviceId)
      .filter((id): id is string => !!id);

    const servicesMap = new Map<string, {
      price: number;
      currency: string;
      discountType: string | null;
      discountValue: number | null;
      discountStartDate: Date | null;
      discountEndDate: Date | null;
    }>();

    if (serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: {
          id: true,
          price: true,
          currency: true,
          discountType: true,
          discountValue: true,
          discountStartDate: true,
          discountEndDate: true,
        },
      });

      services.forEach((service) => {
        servicesMap.set(service.id, {
          price: Number(service.price),
          currency: service.currency,
          discountType: service.discountType,
          discountValue: service.discountValue ? Number(service.discountValue) : null,
          discountStartDate: service.discountStartDate,
          discountEndDate: service.discountEndDate,
        });
      });
    }

    // Process line items using pre-fetched services
    const processedLineItems = lineItems.map((item) => {
      // If serviceId is provided, use the pre-fetched service to check for discounts
      if (item.serviceId) {
        const service = servicesMap.get(item.serviceId);

        if (service) {
          const discountResult = calculateDiscountedPrice({
            price: service.price,
            currency: service.currency,
            discountType: service.discountType as "percentage" | "fixed" | null,
            discountValue: service.discountValue,
            discountStartDate: service.discountStartDate,
            discountEndDate: service.discountEndDate,
          });

          if (discountResult.isDiscounted) {
            return {
              description: item.description,
              quantity: item.quantity,
              unitPrice: discountResult.finalPrice,
              total: item.quantity * discountResult.finalPrice,
              originalUnitPrice: discountResult.originalPrice,
              discountType: service.discountType,
              discountValue: service.discountValue,
              discountPercentage: discountResult.discountPercentage,
            };
          }
        }
      }

      // No service or no discount - use provided values
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        originalUnitPrice: item.originalUnitPrice || null,
        discountType: item.discountType || null,
        discountValue: item.discountValue || null,
        discountPercentage: item.discountPercentage || null,
      };
    });

    // Calculate totals using processed (potentially discounted) prices
    const subtotal = processedLineItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const tax = subtotal * 0.2; // 20% tax (typical VAT)
    const total = subtotal + tax;

    const invoiceNumber = await generateInvoiceNumber(company.id);

    const { user: adminUser } = await validateCompanyAdminAccess(companySlug);

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
          create: processedLineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            originalUnitPrice: item.originalUnitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountPercentage: item.discountPercentage,
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
            image: true,
          },
        },
      },
    });

    // Log audit event
    if (adminUser) {
      await logAuditEvent({
        companyId: company.id,
        userId: adminUser.id,
        action: "CREATE",
        entityType: "Invoice",
        entityId: invoice.id,
        changes: {
          invoiceNumber: { new: invoiceNumber },
          total: { new: total },
          status: { new: "DRAFT" },
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
