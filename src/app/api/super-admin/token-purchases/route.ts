import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — list all token purchases
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
      prisma.tokenPurchase.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.tokenPurchase.aggregate({
        where: { status: "PENDING" },
        _sum: { priceEurCents: true },
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
      totalPendingAmount: pendingAmountResult._sum.priceEurCents || 0,
    };

    const tokenPurchases = await prisma.tokenPurchase.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        tokenPack: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      purchases: tokenPurchases,
      stats,
    });
  } catch (error) {
    console.error("Error fetching token purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch token purchases" },
      { status: 500 }
    );
  }
}

// DELETE — bulk delete token purchases
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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No purchase IDs provided" },
        { status: 400 }
      );
    }

    const result = await prisma.tokenPurchase.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting token purchases:", error);
    return NextResponse.json(
      { error: "Failed to delete token purchases" },
      { status: 500 }
    );
  }
}
