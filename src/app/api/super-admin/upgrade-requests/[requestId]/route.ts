import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendUpgradeApprovedEmail, sendUpgradeRejectedEmail } from "@/lib/email/send";

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
      // Get the requested plan (PRO or BUSINESS)
      // Note: requestedPlanTier is a PlanTier enum, defaults to PRO in schema
      const requestedTier = upgradeRequest.requestedPlanTier ?? "PRO";
      console.log(`[UPGRADE] Processing approval for tier: ${requestedTier}`);

      const plan = await prisma.plan.findUnique({
        where: { tier: requestedTier as "TRIAL" | "PRO" | "BUSINESS" },
      });

      console.log(`[UPGRADE] Found plan:`, plan ? plan.id : "null");

      if (!plan) {
        console.error(`[UPGRADE] Plan not found for tier: ${requestedTier}`);
        return NextResponse.json(
          { error: `${requestedTier} plan not found in database. Please ensure all plans are seeded.` },
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

      // For Business plan, chatbot is always included and extra companies don't matter (unlimited)
      const isBusiness = requestedTier === "BUSINESS";

      // Preserve existing chatbot status OR add chatbot if the request includes it
      const existingHasChatbot = upgradeRequest.user.subscription?.hasChatbot ?? false;
      const hasChatbot = isBusiness ? true : (existingHasChatbot || upgradeRequest.includeChatbot);

      // Add to existing extra company slots, not replace
      const existingExtraSlots = upgradeRequest.user.subscription?.extraCompanySlots ?? 0;
      const extraCompanySlots = isBusiness ? 0 : (existingExtraSlots + upgradeRequest.extraCompanyCount);

      // Update the user's subscription
      if (upgradeRequest.user.subscription) {
        await prisma.userSubscription.update({
          where: { id: upgradeRequest.user.subscription.id },
          data: {
            plan: { connect: { id: plan.id } },
            status: "ACTIVE",
            trialEndsAt: null,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            extraCompanySlots,
            hasChatbot,
            notes: `Upgraded to ${requestedTier} via bank transfer. Chatbot: ${hasChatbot ? "Yes" : "No"}, Extra Companies: ${extraCompanySlots}`,
          },
        });
      } else {
        // Create new subscription if it doesn't exist
        await prisma.userSubscription.create({
          data: {
            user: { connect: { id: upgradeRequest.userId } },
            plan: { connect: { id: plan.id } },
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            extraCompanySlots,
            hasChatbot,
            notes: `Upgraded to ${requestedTier} via bank transfer. Chatbot: ${hasChatbot ? "Yes" : "No"}, Extra Companies: ${extraCompanySlots}`,
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

      // Send approval email to user (non-blocking - don't fail the approval if email fails)
      const planName = upgradeRequest.requestedPlanTier === "PRO" ? "Pro" : "Business";
      try {
        await sendUpgradeApprovedEmail({
          userEmail: upgradeRequest.user.email || "",
          userName: upgradeRequest.user.name || upgradeRequest.user.email || "User",
          planName,
          includeChatbot: upgradeRequest.includeChatbot,
          extraCompanyCount: upgradeRequest.extraCompanyCount,
        });
      } catch (emailError) {
        console.error("Failed to send upgrade approval email:", emailError);
        // Continue - email failure shouldn't block the approval
      }

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

      // Send rejection email to user (non-blocking - don't fail the rejection if email fails)
      const rejectedPlanName = upgradeRequest.requestedPlanTier === "PRO" ? "Pro" : "Business";
      try {
        await sendUpgradeRejectedEmail({
          userEmail: upgradeRequest.user.email || "",
          userName: upgradeRequest.user.name || upgradeRequest.user.email || "User",
          planName: rejectedPlanName,
          adminNotes: adminNotes || undefined,
        });
      } catch (emailError) {
        console.error("Failed to send upgrade rejection email:", emailError);
        // Continue - email failure shouldn't block the rejection
      }

      return NextResponse.json({
        success: true,
        message: "Upgrade request rejected",
      });
    }
  } catch (error) {
    console.error("Error processing upgrade request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process upgrade request", details: errorMessage },
      { status: 500 }
    );
  }
}
