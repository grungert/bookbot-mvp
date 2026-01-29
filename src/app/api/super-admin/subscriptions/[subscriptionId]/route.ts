import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { SubscriptionStatus, PlanTier } from "@prisma/client";

const updateSubscriptionSchema = z.object({
  planTier: z.nativeEnum(PlanTier).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  extraCompanySlots: z.number().min(0).optional(),
  hasChatbot: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  trialEndsAt: z.string().nullable().optional(),
});

// Valid subscription state transitions
// Key = current state, Value = array of allowed target states
const VALID_STATUS_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIALING: ["ACTIVE", "TRIAL_EXPIRED", "CANCELLED"],
  ACTIVE: ["PAST_DUE", "CANCELLED"],
  TRIAL_EXPIRED: ["ACTIVE", "CANCELLED"],
  PAST_DUE: ["ACTIVE", "CANCELLED"],
  CANCELLED: ["ACTIVE"], // Allow reactivation only
};

interface RouteParams {
  params: Promise<{ subscriptionId: string }>;
}

// GET /api/super-admin/subscriptions/[subscriptionId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await params;

    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            memberships: {
              where: { role: "OWNER" },
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        plan: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Get chat usage history
    const chatUsageHistory = await prisma.chatUsage.findMany({
      where: { userId: subscription.userId },
      orderBy: { periodStart: "desc" },
      take: 6,
    });

    return NextResponse.json({
      subscription: {
        ...subscription,
        plan: {
          ...subscription.plan,
          priceMonthly: subscription.plan.priceMonthly.toNumber(),
          extraCompanyPrice: subscription.plan.extraCompanyPrice?.toNumber() ?? null,
        },
      },
      chatUsageHistory,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/super-admin/subscriptions/[subscriptionId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await params;
    const body = await request.json();
    const parsed = updateSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Handle status change with transition validation
    if (parsed.data.status !== undefined && parsed.data.status !== subscription.status) {
      const currentStatus = subscription.status as SubscriptionStatus;
      const newStatus = parsed.data.status;
      const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

      if (!allowedTransitions.includes(newStatus)) {
        return NextResponse.json(
          {
            error: "Invalid status transition",
            details: `Cannot change status from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.status = newStatus;
    }

    // Handle plan change
    if (parsed.data.planTier) {
      const newPlan = await prisma.plan.findUnique({
        where: { tier: parsed.data.planTier },
      });

      if (!newPlan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      updateData.planId = newPlan.id;

      // If upgrading from trial, clear trial date and set status to ACTIVE
      if (
        subscription.status === "TRIALING" &&
        parsed.data.planTier !== "TRIAL"
      ) {
        updateData.status = "ACTIVE";
        updateData.trialEndsAt = null;
      }
    }

    // Handle extra company slots
    if (parsed.data.extraCompanySlots !== undefined) {
      updateData.extraCompanySlots = parsed.data.extraCompanySlots;
    }

    // Handle chatbot toggle
    if (parsed.data.hasChatbot !== undefined) {
      updateData.hasChatbot = parsed.data.hasChatbot;
    }

    // Handle notes
    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    // Handle trial end date
    if (parsed.data.trialEndsAt !== undefined) {
      updateData.trialEndsAt = parsed.data.trialEndsAt
        ? new Date(parsed.data.trialEndsAt)
        : null;
    }

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
