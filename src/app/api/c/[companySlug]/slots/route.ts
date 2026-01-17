import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { getAvailableSlots } from "@/lib/utils/slots";
import { startOfDay, parseISO } from "date-fns";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/slots?date=2024-01-15&serviceId=xxx
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: "ServiceId parameter is required" },
        { status: 400 }
      );
    }

    const date = parseISO(dateStr);

    // Get service to know duration
    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id, isActive: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(company.id, date, service.duration);

    return NextResponse.json({
      date: dateStr,
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
      },
      slots: slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: slot.available,
      })),
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
