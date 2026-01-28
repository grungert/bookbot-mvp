import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendTokenPurchaseUserEmail, sendTokenPurchaseAdminEmail } from "@/lib/email/send";

// Generate a unique payment reference for token purchases
function generatePaymentReference(userId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const userIdPart = userId.slice(-4).toUpperCase();
  return `TOK-${userIdPart}-${timestamp}`;
}

// POST — create a token purchase request
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tokenPackId } = body;

    if (!tokenPackId) {
      return NextResponse.json(
        { error: "Token pack ID is required" },
        { status: 400 }
      );
    }

    // Validate token pack exists and is active
    const tokenPack = await prisma.tokenPack.findUnique({
      where: { id: tokenPackId },
    });

    if (!tokenPack || !tokenPack.isActive) {
      return NextResponse.json(
        { error: "Token pack not found or inactive" },
        { status: 400 }
      );
    }

    // Check for existing pending purchase
    const existingPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        {
          error: "You already have a pending token purchase request",
          code: "EXISTING_PENDING_PURCHASE",
          purchaseId: existingPurchase.id,
        },
        { status: 400 }
      );
    }

    // Generate payment reference
    const paymentReference = generatePaymentReference(user.id);

    // Create token purchase
    const purchase = await prisma.tokenPurchase.create({
      data: {
        userId: user.id,
        tokenPackId: tokenPack.id,
        tokenAmount: tokenPack.tokenAmount,
        priceEurCents: tokenPack.priceEurCents,
        packName: tokenPack.name,
        status: "PENDING",
        paymentReference,
      },
    });

    // Send email to user with bank transfer details
    await sendTokenPurchaseUserEmail({
      userEmail: user.email,
      userName: user.name || user.email,
      packName: tokenPack.name,
      tokenAmount: tokenPack.tokenAmount,
      priceEurCents: tokenPack.priceEurCents,
      paymentReference,
    });

    // Send notification email to super admin
    await sendTokenPurchaseAdminEmail({
      userName: user.name || "",
      userEmail: user.email,
      packName: tokenPack.name,
      tokenAmount: tokenPack.tokenAmount,
      priceEurCents: tokenPack.priceEurCents,
      paymentReference,
      purchaseId: purchase.id,
    });

    return NextResponse.json({
      success: true,
      message: "Token purchase request submitted successfully",
      purchaseId: purchase.id,
      paymentReference,
    });
  } catch (error) {
    console.error("Error creating token purchase:", error);
    return NextResponse.json(
      { error: "Failed to create token purchase request" },
      { status: 500 }
    );
  }
}

// GET — check user's pending token purchase
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pendingPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!pendingPurchase) {
      return NextResponse.json({ hasPendingPurchase: false });
    }

    return NextResponse.json({
      hasPendingPurchase: true,
      purchase: {
        id: pendingPurchase.id,
        packName: pendingPurchase.packName,
        tokenAmount: pendingPurchase.tokenAmount,
        priceEurCents: pendingPurchase.priceEurCents,
        paymentReference: pendingPurchase.paymentReference,
        createdAt: pendingPurchase.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching token purchase:", error);
    return NextResponse.json(
      { error: "Failed to fetch token purchase" },
      { status: 500 }
    );
  }
}

// DELETE — cancel pending token purchase
export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pendingPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (!pendingPurchase) {
      return NextResponse.json(
        { error: "No pending token purchase found" },
        { status: 404 }
      );
    }

    await prisma.tokenPurchase.update({
      where: { id: pendingPurchase.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Token purchase cancelled",
    });
  } catch (error) {
    console.error("Error cancelling token purchase:", error);
    return NextResponse.json(
      { error: "Failed to cancel token purchase" },
      { status: 500 }
    );
  }
}
