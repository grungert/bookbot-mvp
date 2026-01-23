import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH to toggle auto-renew status
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request. 'enabled' must be a boolean." },
        { status: 400 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Update subscription status
    // ACTIVE = auto-renew enabled, CANCELLED = auto-renew disabled (will expire at period end)
    const newStatus = enabled ? "ACTIVE" : "CANCELLED";

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: newStatus,
        notes: enabled
          ? `Auto-renew enabled by user on ${new Date().toISOString()}`
          : `Auto-renew disabled by user on ${new Date().toISOString()}. Will expire at period end.`,
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedSubscription.status,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd.toISOString(),
      message: enabled
        ? "Auto-renew has been enabled"
        : "Auto-renew has been disabled. Your subscription will remain active until the end of the current billing period.",
    });
  } catch (error) {
    console.error("Error updating auto-renew status:", error);
    return NextResponse.json(
      { error: "Failed to update auto-renew status" },
      { status: 500 }
    );
  }
}
