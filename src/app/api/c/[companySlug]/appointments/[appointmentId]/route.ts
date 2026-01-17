import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";

const updateAppointmentSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  notes: z.string().optional(),
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

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: parsed.data,
      include: {
        service: true,
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
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
