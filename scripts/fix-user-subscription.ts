/**
 * Script to fix existing users who registered before the trial subscription was automatic
 * Run with: npx tsx scripts/fix-user-subscription.ts <email>
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function fixUserSubscription(email: string) {
  console.log(`Looking for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { subscription: true },
  });

  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email})`);
  console.log(`Current role: ${user.role}`);
  console.log(`Has subscription: ${user.subscription ? "Yes" : "No"}`);

  // Update user role if needed
  if (user.role !== "COMPANY_ADMIN" && user.role !== "SUPER_ADMIN") {
    console.log("\nUpdating role to COMPANY_ADMIN...");
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "COMPANY_ADMIN" },
    });
    console.log("Role updated!");
  }

  // Create trial subscription if missing
  if (!user.subscription) {
    console.log("\nCreating trial subscription...");

    const trialPlan = await prisma.plan.findUnique({
      where: { tier: "TRIAL" },
    });

    if (!trialPlan) {
      console.error("Trial plan not found in database!");
      process.exit(1);
    }

    const now = new Date();
    const trialEndsAt = new Date(
      now.getTime() + (trialPlan.trialDays ?? 14) * 24 * 60 * 60 * 1000
    );
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: trialPlan.id,
        status: "TRIALING",
        trialEndsAt,
        currentPeriodEnd: periodEnd,
      },
    });

    console.log("Trial subscription created!");
    console.log(`Trial ends: ${trialEndsAt.toLocaleDateString()}`);
  }

  console.log("\nDone! User can now create companies.");
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log("Usage: npx tsx scripts/fix-user-subscription.ts <email>");
  process.exit(1);
}

fixUserSubscription(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
