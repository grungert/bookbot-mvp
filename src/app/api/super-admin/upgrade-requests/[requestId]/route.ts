import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

// GET individual upgrade request
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId } = await params;

    const upgradeRequest = await prisma.upgradeRequest.findUnique({
      where: { id: requestId },
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
      },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: "Upgrade request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(upgradeRequest);
  } catch (error) {
    console.error("Error fetching upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to fetch upgrade request" },
      { status: 500 }
    );
  }
}

// PATCH to approve or reject upgrade request
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId } = await params;
    const body = await request.json();
    const { action, adminNotes } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the upgrade request
    const upgradeRequest = await prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: "Upgrade request not found" },
        { status: 404 }
      );
    }

    if (upgradeRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Get the PRO plan
      const proPlan = await prisma.plan.findUnique({
        where: { tier: "PRO" },
      });

      if (!proPlan) {
        return NextResponse.json(
          { error: "PRO plan not found" },
          { status: 500 }
        );
      }

      const now = new Date();
      const periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      // Update the user's subscription
      if (upgradeRequest.user.subscription) {
        await prisma.userSubscription.update({
          where: { id: upgradeRequest.user.subscription.id },
          data: {
            planId: proPlan.id,
            status: "ACTIVE",
            trialEndsAt: null,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            extraCompanySlots: upgradeRequest.extraCompanyCount,
            notes: `Upgraded via bank transfer. Chatbot: ${upgradeRequest.includeChatbot ? "Yes" : "No"}, Extra Companies: ${upgradeRequest.extraCompanyCount}`,
          },
        });
      } else {
        // Create new subscription if it doesn't exist
        await prisma.userSubscription.create({
          data: {
            userId: upgradeRequest.userId,
            planId: proPlan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            extraCompanySlots: upgradeRequest.extraCompanyCount,
            notes: `Upgraded via bank transfer. Chatbot: ${upgradeRequest.includeChatbot ? "Yes" : "No"}, Extra Companies: ${upgradeRequest.extraCompanyCount}`,
          },
        });
      }

      // Update upgrade request status
      await prisma.upgradeRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          handledBy: user.id,
          handledAt: now,
          adminNotes: adminNotes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Upgrade request approved and subscription activated",
      });
    } else {
      // Reject the request
      await prisma.upgradeRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          handledBy: user.id,
          handledAt: new Date(),
          adminNotes: adminNotes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Upgrade request rejected",
      });
    }
  } catch (error) {
    console.error("Error processing upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to process upgrade request" },
      { status: 500 }
    );
  }
}
