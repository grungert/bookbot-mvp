import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess, getCompanyBySlug } from "@/lib/db/tenant";
import { logAuditEvent, getClientIp, getUserAgent, computeChanges } from "@/lib/db/audit";
import { z } from "zod";

// Helper to validate max 2 decimal places
const decimalPrecision = (val: number) => {
  const decimalPart = val.toString().split('.')[1];
  return !decimalPart || decimalPart.length <= 2;
};

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().int().min(5).max(480).optional(),
  price: z.number().min(0).refine(decimalPrecision, {
    message: "Price must have at most 2 decimal places"
  }).optional(),
  currency: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isActive: z.boolean().optional(),
  // Discount fields
  discountType: z.enum(["percentage", "fixed"]).nullable().optional(),
  discountValue: z.number().min(0).refine(decimalPrecision, {
    message: "Discount value must have at most 2 decimal places"
  }).nullable().optional(),
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
  params: Promise<{ companySlug: string; serviceId: string }>;
}

// GET /api/c/[companySlug]/services/[serviceId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, serviceId } = await params;
    const { searchParams } = new URL(request.url);
    const checkAppointments = searchParams.get("checkAppointments") === "true";

    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        companyId: company.id,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // If checking for appointments, count future appointments
    if (checkAppointments) {
      const futureAppointmentCount = await prisma.appointment.count({
        where: {
          serviceId: serviceId,
          startTime: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });
      return NextResponse.json({ ...service, futureAppointmentCount });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/services/[serviceId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, serviceId } = await params;
    const { error, company, user } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found", code: error === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    // Verify service belongs to company
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Validate fixed discount doesn't exceed price
    const effectivePrice = parsed.data.price ?? Number(existingService.price);
    if (parsed.data.discountType === "fixed" && parsed.data.discountValue != null) {
      if (parsed.data.discountValue > effectivePrice) {
        return NextResponse.json(
          {
            error: "Invalid input",
            code: "VALIDATION_ERROR",
            details: {
              fieldErrors: { discountValue: ["Fixed discount cannot exceed the service price"] },
              formErrors: []
            }
          },
          { status: 400 }
        );
      }
    }

    // Transform date strings to Date objects
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.discountStartDate !== undefined) {
      updateData.discountStartDate = parsed.data.discountStartDate ? new Date(parsed.data.discountStartDate) : null;
    }
    if (parsed.data.discountEndDate !== undefined) {
      updateData.discountEndDate = parsed.data.discountEndDate ? new Date(parsed.data.discountEndDate) : null;
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Log audit event (user already available from initial access check)
    if (user) {
      const changes = computeChanges(
        {
          name: existingService.name,
          price: Number(existingService.price),
          isActive: existingService.isActive,
          discountType: existingService.discountType,
          discountValue: existingService.discountValue ? Number(existingService.discountValue) : null,
        },
        {
          name: parsed.data.name,
          price: parsed.data.price,
          isActive: parsed.data.isActive,
          discountType: parsed.data.discountType,
          discountValue: parsed.data.discountValue,
        },
        ["name", "price", "isActive", "discountType", "discountValue"]
      );

      if (changes) {
        await logAuditEvent({
          companyId: company.id,
          userId: user.id,
          action: "UPDATE",
          entityType: "Service",
          entityId: serviceId,
          changes,
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
        });
      }
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/c/[companySlug]/services/[serviceId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, serviceId } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    const { error, company, user } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found", code: error === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    // Verify service belongs to company
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check for future appointments unless force delete is requested
    if (!forceDelete) {
      const futureAppointmentCount = await prisma.appointment.count({
        where: {
          serviceId: serviceId,
          startTime: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      if (futureAppointmentCount > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete service with scheduled appointments",
            code: "HAS_APPOINTMENTS",
            futureAppointmentCount,
            details: {
              message: `This service has ${futureAppointmentCount} upcoming appointment(s). Please reschedule or cancel them before deleting, or use force=true to delete anyway.`
            }
          },
          { status: 409 }
        );
      }
    }

    // Soft delete by setting isActive to false
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    // Log audit event
    if (user) {
      await logAuditEvent({
        companyId: company.id,
        userId: user.id,
        action: "DELETE",
        entityType: "Service",
        entityId: serviceId,
        changes: {
          name: { old: existingService.name },
          isActive: { old: true, new: false },
          ...(forceDelete && { forceDelete: { new: true } }),
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
