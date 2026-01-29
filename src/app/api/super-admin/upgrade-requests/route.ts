import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema for validating CUID arrays (#14)
const deleteIdsSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one ID required"),
});

// DELETE multiple upgrade requests
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate IDs are valid CUIDs (#14)
    const parsed = deleteIdsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid IDs provided", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ids } = parsed.data;

    // Delete the upgrade requests
    const result = await prisma.upgradeRequest.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting upgrade requests:", error);
    return NextResponse.json(
      { error: "Failed to delete upgrade requests" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get stats using database aggregation
    const [statusCounts, pendingAmountResult] = await Promise.all([
      prisma.upgradeRequest.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.upgradeRequest.aggregate({
        where: { status: "PENDING" },
        _sum: { totalMonthlyPrice: true },
      }),
    ]);

    // Format status counts
    const statsMap: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    statusCounts.forEach((item) => {
      statsMap[item.status] = item._count;
    });

    const stats = {
      pending: statsMap.PENDING,
      approved: statsMap.APPROVED,
      rejected: statsMap.REJECTED,
      cancelled: statsMap.CANCELLED,
      totalPendingAmount: pendingAmountResult._sum.totalMonthlyPrice || 0,
    };

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
