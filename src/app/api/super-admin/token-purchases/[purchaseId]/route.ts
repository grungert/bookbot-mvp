import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTokenPurchaseApprovedEmail, sendTokenPurchaseRejectedEmail } from "@/lib/email/send";

interface RouteParams {
  params: Promise<{ purchaseId: string }>;
}

// GET — individual token purchase detail
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { purchaseId } = await params;

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
        tokenPack: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Token purchase not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error fetching token purchase:", error);
    return NextResponse.json(
      { error: "Failed to fetch token purchase" },
      { status: 500 }
    );
  }
}

// PATCH — approve or reject token purchase
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { purchaseId } = await params;
    const body = await request.json();
    const { action, adminNotes: rawAdminNotes } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Sanitize admin notes: max length and basic validation (#26)
    let adminNotes: string | null = null;
    if (rawAdminNotes && typeof rawAdminNotes === "string") {
      // Limit to 1000 chars and strip any HTML-like tags
      adminNotes = rawAdminNotes.slice(0, 1000).replace(/<[^>]*>/g, "").trim() || null;
    }

    // Get the token purchase
    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Token purchase not found" },
        { status: 404 }
      );
    }

    if (purchase.status !== "PENDING") {
      return NextResponse.json(
        { error: "This purchase has already been processed" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "approve") {
      // Error if no subscription to credit tokens to (#7)
      if (!purchase.user.subscription) {
        return NextResponse.json(
          { error: "Cannot credit tokens: user has no active subscription" },
          { status: 400 }
        );
      }

      // Credit bonus tokens to user's subscription
      await prisma.userSubscription.update({
        where: { id: purchase.user.subscription.id },
        data: {
          bonusTokenBalance: {
            increment: purchase.tokenAmount,
          },
        },
      });

      // Update purchase status
      await prisma.tokenPurchase.update({
        where: { id: purchaseId },
        data: {
          status: "APPROVED",
          handledBy: user.id,
          handledAt: now,
          adminNotes: adminNotes || null,
        },
      });

      // Send approval email (non-blocking - don't fail the approval if email fails)
      try {
        await sendTokenPurchaseApprovedEmail({
          userEmail: purchase.user.email || "",
          userName: purchase.user.name || purchase.user.email || "User",
          packName: purchase.packName,
          tokenAmount: purchase.tokenAmount,
          adminNotes: adminNotes || undefined,
        });
      } catch (emailError) {
        console.error("Failed to send token purchase approval email:", emailError);
        // Continue - email failure shouldn't block the approval
      }

      return NextResponse.json({
        success: true,
        message: "Token purchase approved and tokens credited",
      });
    } else {
      // Reject the purchase
      await prisma.tokenPurchase.update({
        where: { id: purchaseId },
        data: {
          status: "REJECTED",
          handledBy: user.id,
          handledAt: now,
          adminNotes: adminNotes || null,
        },
      });

      // Send rejection email (non-blocking - don't fail the rejection if email fails)
      try {
        await sendTokenPurchaseRejectedEmail({
          userEmail: purchase.user.email || "",
          userName: purchase.user.name || purchase.user.email || "User",
          packName: purchase.packName,
          tokenAmount: purchase.tokenAmount,
          adminNotes: adminNotes || undefined,
        });
      } catch (emailError) {
        console.error("Failed to send token purchase rejection email:", emailError);
        // Continue - email failure shouldn't block the rejection
      }

      return NextResponse.json({
        success: true,
        message: "Token purchase rejected",
      });
    }
  } catch (error) {
    console.error("Error processing token purchase:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process token purchase", details: errorMessage },
      { status: 500 }
    );
  }
}
