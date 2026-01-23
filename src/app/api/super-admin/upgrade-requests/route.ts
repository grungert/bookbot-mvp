import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const upgradeRequests = await prisma.upgradeRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    // Get stats
    const stats = {
      pending: upgradeRequests.filter(r => r.status === "PENDING").length,
      approved: upgradeRequests.filter(r => r.status === "APPROVED").length,
      rejected: upgradeRequests.filter(r => r.status === "REJECTED").length,
      cancelled: upgradeRequests.filter(r => r.status === "CANCELLED").length,
      totalPendingAmount: upgradeRequests
        .filter(r => r.status === "PENDING")
        .reduce((sum, r) => sum + r.totalMonthlyPrice, 0),
    };

    return NextResponse.json({
      requests: upgradeRequests,
      stats,
    });
  } catch (error) {
    console.error("Error fetching upgrade requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch upgrade requests" },
      { status: 500 }
    );
  }
}
