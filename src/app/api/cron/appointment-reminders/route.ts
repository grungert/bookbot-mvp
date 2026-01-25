import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminderEmail } from "@/lib/email/send";
import { addHours } from "date-fns";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is set, allow in development
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/appointment-reminders
// This endpoint is called by Vercel Cron or an external scheduler
// It sends reminder emails for appointments starting in the next 24 hours
export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24Hours = addHours(now, 24);

    // Find appointments starting in the next 24 hours that haven't received a reminder
    // and are not cancelled
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lte: in24Hours,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        reminderSentAt: null,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${appointments.length} appointments needing reminders`);

    const results = {
      total: appointments.length,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const appointment of appointments) {
      // Skip if user has no email
      if (!appointment.user.email) {
        console.log(`[CRON] Skipping appointment ${appointment.id} - no email`);
        results.skipped++;
        continue;
      }

      try {
        // Send reminder email
        const emailResult = await sendAppointmentReminderEmail({
          customerEmail: appointment.user.email,
          customerName: appointment.user.name || "Customer",
          serviceName: appointment.service.name,
          startTime: appointment.startTime,
          duration: appointment.service.duration,
          companyName: appointment.company.name,
        });

        if (emailResult.success) {
          // Mark as reminder sent
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSentAt: new Date() },
          });
          results.sent++;
          console.log(`[CRON] Sent reminder for appointment ${appointment.id}`);
        } else {
          results.failed++;
          console.error(`[CRON] Failed to send reminder for ${appointment.id}:`, emailResult.error);
        }
      } catch (error) {
        results.failed++;
        console.error(`[CRON] Error processing appointment ${appointment.id}:`, error);
      }
    }

    console.log(`[CRON] Reminder job completed:`, results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} appointments`,
      results,
    });
  } catch (error) {
    console.error("[CRON] Error in appointment reminder job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
