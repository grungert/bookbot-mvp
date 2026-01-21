import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { sendCancellationEmail, sendAppointmentUpdateEmail } from "@/lib/email/send";
import { createInvoiceForAppointment } from "@/lib/invoices";
import { logAuditEvent, getClientIp, getUserAgent, computeChanges } from "@/lib/db/audit";
import { updateCustomerMetrics } from "@/lib/db/customer-metrics";
import { isValidTransition, getInvalidTransitionError, getValidNextStatuses } from "@/lib/utils/appointment-status";
import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { addMinutes } from "date-fns";

const updateAppointmentSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  notes: z.string().nullable().optional(),
  cancellationReason: z.string().optional(),
  startTime: z.string().datetime().optional(),
  serviceId: z.string().optional(),
  sendNotification: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string; appointmentId: string }>;
}

// GET /api/c/[companySlug]/appointments/[appointmentId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, appointmentId } = await params;
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        companyId: company.id,
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        invoice: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only see their own appointments
    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "COMPANY_ADMIN" &&
      appointment.userId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/appointments/[appointmentId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, appointmentId } = await params;
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        companyId: company.id,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Users can only cancel their own appointments
    // Admins can change any status
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "COMPANY_ADMIN";
    const isOwner = appointment.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Users can only cancel, not change to other statuses
    if (!isAdmin && parsed.data.status && parsed.data.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Users can only cancel appointments" },
        { status: 403 }
      );
    }

    // Validate status transition
    if (parsed.data.status) {
      const currentStatus = appointment.status as AppointmentStatus;
      const newStatus = parsed.data.status as AppointmentStatus;

      if (!isValidTransition(currentStatus, newStatus)) {
        const errorMessage = getInvalidTransitionError(currentStatus, newStatus);
        const validOptions = getValidNextStatuses(currentStatus);

        return NextResponse.json(
          {
            error: errorMessage,
            currentStatus,
            requestedStatus: newStatus,
            validOptions,
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    };

    // Handle service change
    let newService = null;
    if (parsed.data.serviceId && parsed.data.serviceId !== appointment.serviceId) {
      newService = await prisma.service.findFirst({
        where: { id: parsed.data.serviceId, companyId: company.id },
      });
      if (!newService) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
      updateData.serviceId = parsed.data.serviceId;
    }

    // Handle time change
    const hasTimeChange = parsed.data.startTime && new Date(parsed.data.startTime).getTime() !== appointment.startTime.getTime();
    const hasServiceChange = newService !== null;

    if (hasTimeChange || hasServiceChange) {
      const newStartTime = parsed.data.startTime ? new Date(parsed.data.startTime) : appointment.startTime;
      const serviceDuration = newService?.duration || (await prisma.service.findUnique({ where: { id: appointment.serviceId } }))?.duration || 60;
      const newEndTime = addMinutes(newStartTime, serviceDuration);

      updateData.startTime = newStartTime;
      updateData.endTime = newEndTime;
    }

    // Add cancellation tracking if status is being changed to CANCELLED
    if (parsed.data.status === "CANCELLED") {
      updateData.cancellationReason = parsed.data.cancellationReason || null;
      updateData.cancelledBy = isAdmin ? "admin" : "customer";
      updateData.cancelledAt = new Date();
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            currency: true,
            discountType: true,
            discountValue: true,
            discountStartDate: true,
            discountEndDate: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send cancellation email if status changed to CANCELLED
    if (parsed.data.status === "CANCELLED" && updated.user?.email) {
      await sendCancellationEmail({
        customerEmail: updated.user.email,
        customerName: updated.user.name || "Customer",
        serviceName: updated.service.name,
        startTime: updated.startTime,
        companyName: company.name,
      });
    }

    // Send update notification email if appointment details changed (not status)
    if (parsed.data.sendNotification && (hasTimeChange || hasServiceChange) && updated.user?.email) {
      try {
        await sendAppointmentUpdateEmail({
          customerEmail: updated.user.email,
          customerName: updated.user.name || "Customer",
          serviceName: updated.service.name,
          startTime: updated.startTime,
          companyName: company.name,
          previousStartTime: hasTimeChange ? appointment.startTime : undefined,
        });
      } catch (emailError) {
        console.error("Error sending appointment update email:", emailError);
        // Don't fail the update if email fails
      }
    }

    // Auto-generate invoice when appointment is confirmed
    if (parsed.data.status === "CONFIRMED") {
      try {
        await createInvoiceForAppointment({
          companyId: company.id,
          userId: updated.userId,
          appointmentId: updated.id,
          appointmentDate: updated.startTime,
          serviceName: updated.service.name,
          serviceDuration: updated.service.duration,
          servicePrice: updated.service.price,
          serviceCurrency: updated.service.currency,
          taxRate: company.taxRate,
          discountType: updated.service.discountType,
          discountValue: updated.service.discountValue,
          discountStartDate: updated.service.discountStartDate,
          discountEndDate: updated.service.discountEndDate,
        });
      } catch (invoiceError) {
        console.error("Error auto-generating invoice:", invoiceError);
        // Don't fail the appointment update if invoice generation fails
      }
    }

    // Update customer metrics when appointment is completed or cancelled
    if (parsed.data.status === "COMPLETED" || parsed.data.status === "CANCELLED") {
      // Run in background - don't block the response
      updateCustomerMetrics(updated.userId).catch((error) => {
        console.error("Error updating customer metrics:", error);
      });
    }

    // Log audit event
    const changes = computeChanges(
      { status: appointment.status, notes: appointment.notes },
      { status: parsed.data.status, notes: parsed.data.notes },
      ["status", "notes"]
    );

    if (changes) {
      await logAuditEvent({
        companyId: company.id,
        userId: user.id,
        action: "UPDATE",
        entityType: "Appointment",
        entityId: appointmentId,
        changes,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
