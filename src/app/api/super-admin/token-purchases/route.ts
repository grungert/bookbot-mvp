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

    // Get stats
    const stats = {
      pending: tokenPurchases.filter(p => p.status === "PENDING").length,
      approved: tokenPurchases.filter(p => p.status === "APPROVED").length,
      rejected: tokenPurchases.filter(p => p.status === "REJECTED").length,
      cancelled: tokenPurchases.filter(p => p.status === "CANCELLED").length,
      totalPendingAmount: tokenPurchases
        .filter(p => p.status === "PENDING")
        .reduce((sum, p) => sum + p.priceEurCents, 0),
    };

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
