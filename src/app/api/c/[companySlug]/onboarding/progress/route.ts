import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/onboarding/progress
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

    // Verify user has admin access to this company
    const membership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });

    if (user.role !== "SUPER_ADMIN" && !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check completion status for each checklist item
    const [
      serviceCount,
      workingHoursWithOpen,
      appointmentCount,
      sentInvoiceCount,
      documentCount,
    ] = await Promise.all([
      // Has at least one service
      prisma.service.count({
        where: { companyId: company.id },
      }),

      // Has working hours with at least one open day
      prisma.workingHours.findFirst({
        where: {
          companyId: company.id,
          isOpen: true,
        },
      }),

      // Has at least one appointment
      prisma.appointment.count({
        where: { companyId: company.id },
      }),

      // Has at least one sent invoice
      prisma.invoice.count({
        where: {
          companyId: company.id,
          status: "SENT",
        },
      }),

      // Has at least one document
      prisma.document.count({
        where: { companyId: company.id },
      }),
    ]);

    // Company settings check - name and timezone should be set
    const hasCompanySettings = !!(company.name && company.timezone);

    // Logo check
    const hasLogo = !!company.logoUrl;

    // Booking channel check - WhatsApp or Viber enabled
    const hasBookingChannel = company.whatsappEnabled || company.viberEnabled;

    // Bot personality check - custom bot name configured
    const hasBotPersonality = !!company.aiBotName;

    return NextResponse.json({
      hasService: serviceCount > 0,
      hasWorkingHours: !!workingHoursWithOpen,
      hasCompanySettings,
      hasLogo,
      hasBookingChannel,
      hasBotPersonality,
      hasAppointment: appointmentCount > 0,
      hasSentInvoice: sentInvoiceCount > 0,
      hasDocument: documentCount > 0,
    });
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
