import { PrismaClient, PlanTier } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    name: "Trial",
    tier: PlanTier.TRIAL,
    description: "14-day free trial",
    baseCompanies: 1,
    maxCompanies: 1,
    extraCompanyPrice: null,
    maxChatMessagesPerMonth: 50,
    maxDocumentsPerCompany: 3,
    trialDays: 14,
    customBranding: false,
    prioritySupport: false,
    priceMonthly: 0,
  },
  {
    name: "Pro",
    tier: PlanTier.PRO,
    description: "For growing businesses",
    baseCompanies: 1,
    maxCompanies: 10, // Can buy up to 10 total
    extraCompanyPrice: 15, // +$15 per extra company
    maxChatMessagesPerMonth: 1000,
    maxDocumentsPerCompany: 20,
    trialDays: null,
    customBranding: true,
    prioritySupport: false,
    priceMonthly: 29,
  },
  {
    name: "Business",
    tier: PlanTier.BUSINESS,
    description: "Unlimited companies, high volume",
    baseCompanies: -1, // Unlimited
    maxCompanies: -1,
    extraCompanyPrice: null,
    maxChatMessagesPerMonth: 10000,
    maxDocumentsPerCompany: -1, // Unlimited
    trialDays: null,
    customBranding: true,
    prioritySupport: true,
    priceMonthly: 99,
  },
];

async function main() {
  console.log("Seeding plans...");

  for (const plan of plans) {
    const existing = await prisma.plan.findUnique({
      where: { tier: plan.tier },
    });

    if (existing) {
      // Update existing plan
      await prisma.plan.update({
        where: { tier: plan.tier },
        data: plan,
      });
      console.log(`Updated plan: ${plan.name}`);
    } else {
      // Create new plan
      await prisma.plan.create({
        data: plan,
      });
      console.log(`Created plan: ${plan.name}`);
    }
  }

  // Create trial subscriptions for existing COMPANY_ADMIN users without a subscription
  console.log("Creating trial subscriptions for existing users...");

  const trialPlan = await prisma.plan.findUnique({
    where: { tier: PlanTier.TRIAL },
  });

  if (trialPlan) {
    const usersWithoutSubscription = await prisma.user.findMany({
      where: {
        role: "COMPANY_ADMIN",
        subscription: null,
      },
      select: { id: true, email: true },
    });

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of current month

    for (const user of usersWithoutSubscription) {
      await prisma.userSubscription.create({
        data: {
          userId: user.id,
          planId: trialPlan.id,
          status: "TRIALING",
          trialEndsAt,
          currentPeriodEnd: periodEnd,
        },
      });
      console.log(`Created trial subscription for user: ${user.email}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
