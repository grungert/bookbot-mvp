import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { sendBookingConfirmationEmail, sendNewBookingAdminEmail } from "@/lib/email/send";
import { addMinutes } from "date-fns";
import { z } from "zod";
import { AppointmentStatus, Prisma } from "@prisma/client";

const createAppointmentSchema = z.object({
  serviceId: z.string(),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
  // Guest checkout fields
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/appointments
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const myOnly = searchParams.get("myOnly") === "true";

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

    // Build where clause
    const where: Prisma.AppointmentWhereInput = {
      companyId: company.id,
    };

    // Non-admin users can only see their own appointments
    // OR if myOnly=true is passed (for "My Appointments" customer page)
    if (myOnly || !isCompanyAdmin) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status as AppointmentStatus;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) (where.startTime as { gte?: Date; lte?: Date }).gte = new Date(startDate);
      if (endDate) (where.startTime as { gte?: Date; lte?: Date }).lte = new Date(endDate);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/c/[companySlug]/appointments
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const sessionUser = await getCurrentUser();

    // We only need id, email, and name for creating appointments
    let user: { id: string; email: string | null; name: string | null } | null = sessionUser
      ? { id: sessionUser.id, email: sessionUser.email ?? null, name: sessionUser.name ?? null }
      : null;

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceId, startTime, notes, guestName, guestEmail, guestPhone } = parsed.data;

    // Handle guest checkout - require guest info if not logged in
    if (!user) {
      if (!guestEmail || !guestName) {
        return NextResponse.json(
          { error: "Guest name and email are required for booking" },
          { status: 400 }
        );
      }

      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: guestEmail },
      });

      if (existingUser) {
        // Use existing user
        user = existingUser;
      } else {
        // Create new user with random password (they can reset later)
        const randomPassword = Math.random().toString(36).slice(-12);
        const hashedPassword = await hashPassword(randomPassword);

        user = await prisma.user.create({
          data: {
            email: guestEmail,
            name: guestName,
            phone: guestPhone || null,
            password: hashedPassword,
            role: "USER",
          },
        });
      }
    }

    // Get the service
    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id, isActive: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const appointmentStart = new Date(startTime);
    const appointmentEnd = addMinutes(appointmentStart, service.duration);

    // Use atomic transaction to prevent race conditions
    // Check availability and create appointment in a single transaction
    let appointment;
    try {
      appointment = await prisma.$transaction(
        async (tx) => {
          // Check for conflicting appointments within the transaction
          const conflicting = await tx.appointment.findFirst({
            where: {
              companyId: company.id,
              status: { in: ["PENDING", "CONFIRMED"] },
              OR: [
                {
                  startTime: { gte: appointmentStart, lt: appointmentEnd },
                },
                {
                  endTime: { gt: appointmentStart, lte: appointmentEnd },
                },
                {
                  AND: [
                    { startTime: { lte: appointmentStart } },
                    { endTime: { gte: appointmentEnd } },
                  ],
                },
              ],
            },
          });

          if (conflicting) {
            throw new Error("SLOT_TAKEN");
          }

          // Also verify working hours within transaction
          const dayOfWeek = appointmentStart.getDay();
          const workingHours = await tx.workingHours.findUnique({
            where: {
              companyId_dayOfWeek: {
                companyId: company.id,
                dayOfWeek,
              },
            },
          });

          if (!workingHours || !workingHours.isOpen) {
            throw new Error("OUTSIDE_WORKING_HOURS");
          }

          // Create the appointment
          return tx.appointment.create({
            data: {
              companyId: company.id,
              userId: user.id,
              serviceId: service.id,
              startTime: appointmentStart,
              endTime: appointmentEnd,
              status: "PENDING",
              notes,
            },
            include: {
              service: true,
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
        },
        {
          isolationLevel: "Serializable",
        }
      );
    } catch (txError) {
      if (txError instanceof Error) {
        if (txError.message === "SLOT_TAKEN") {
          return NextResponse.json(
            { error: "Time slot is no longer available. Please select another time." },
            { status: 409 }
          );
        }
        if (txError.message === "OUTSIDE_WORKING_HOURS") {
          return NextResponse.json(
            { error: "Selected time is outside working hours" },
            { status: 400 }
          );
        }
      }
      throw txError;
    }

    // Send confirmation email to customer
    if (user.email) {
      await sendBookingConfirmationEmail({
        customerEmail: user.email,
        customerName: user.name || "Customer",
        serviceName: service.name,
        startTime: appointmentStart,
        duration: service.duration,
        companyName: company.name,
        notes: notes || undefined,
      });
    }

    // Send notification email to company admins
    const notificationEmails = company.notificationEmails || [];
    // Also include businessEmail if set (for backwards compatibility)
    if (company.businessEmail && !notificationEmails.includes(company.businessEmail)) {
      notificationEmails.push(company.businessEmail);
    }

    if (notificationEmails.length > 0) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
      // Send to all notification emails - use try-catch to prevent booking failure if email fails
      try {
        await Promise.allSettled(
          notificationEmails.map((adminEmail) =>
            sendNewBookingAdminEmail({
              adminEmail,
              customerName: user.name || "Customer",
              customerEmail: user.email || "",
              serviceName: service.name,
              startTime: appointmentStart,
              duration: service.duration,
              companyName: company.name,
              appointmentUrl: `${baseUrl}/en/c/${companySlug}/admin/appointments?id=${appointment.id}`,
            })
          )
        );
      } catch (error) {
        console.error("[EMAIL] Failed to send admin notifications:", error);
        // Don't fail the booking, just log the error
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
