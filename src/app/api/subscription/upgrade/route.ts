import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { upgradeSubscription } from "@/lib/subscription/trial";
import { getUserSubscription } from "@/lib/subscription/limits";
import { PlanTier } from "@prisma/client";

// Define tier hierarchy for upgrade/downgrade comparison
// Higher number = higher tier
const TIER_HIERARCHY: Record<PlanTier, number> = {
  TRIAL: 0,
  PRO: 1,
  BUSINESS: 2,
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planTier } = body;

    // Validate plan tier
    const validTiers: PlanTier[] = ["PRO", "BUSINESS"];
    if (!planTier || !validTiers.includes(planTier)) {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    // Get current subscription to check for downgrades
    const currentSubscription = await getUserSubscription(user.id);
    if (currentSubscription) {
      const currentTierLevel = TIER_HIERARCHY[currentSubscription.plan.tier];
      const newTierLevel = TIER_HIERARCHY[planTier as PlanTier];

      // Prevent downgrades (new tier lower than current)
      if (newTierLevel < currentTierLevel) {
        return NextResponse.json(
          {
            error: "Cannot downgrade to a lower plan tier. Please contact support for downgrades.",
            code: "DOWNGRADE_NOT_ALLOWED",
            currentTier: currentSubscription.plan.tier,
            requestedTier: planTier,
          },
          { status: 400 }
        );
      }

      // Prevent upgrading to the same tier
      if (newTierLevel === currentTierLevel && currentSubscription.plan.tier === planTier) {
        return NextResponse.json(
          {
            error: "You are already on this plan tier.",
            code: "SAME_TIER",
            currentTier: currentSubscription.plan.tier,
          },
          { status: 400 }
        );
      }
    }

    // Attempt to upgrade
    const result = await upgradeSubscription(user.id, planTier);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to upgrade subscription" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription upgraded successfully",
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}
