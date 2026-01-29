import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/user/appointments/count
// Returns count of upcoming appointments for logged-in user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.appointment.count({
      where: {
        userId: user.id,
        startTime: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching appointment count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
