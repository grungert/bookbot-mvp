/**
 * Migration script to create CompanyMembership records for existing users.
 *
 * This script:
 * 1. Finds all COMPANY_ADMIN users with a companyId
 * 2. Creates CompanyMembership records with OWNER role and isPrimary = true
 *
 * Run with: npx tsx scripts/migrate-company-memberships.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

const prisma = createPrismaClient();

async function main() {
  console.log("Starting CompanyMembership migration...");

  // Find all COMPANY_ADMIN users with a companyId
  const admins = await prisma.user.findMany({
    where: {
      role: "COMPANY_ADMIN",
      companyId: { not: null },
    },
    select: {
      id: true,
      email: true,
      companyId: true,
    },
  });

  console.log(`Found ${admins.length} COMPANY_ADMIN users to migrate`);

  let created = 0;
  let skipped = 0;

  for (const admin of admins) {
    // Check if membership already exists
    const existingMembership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: admin.id,
          companyId: admin.companyId!,
        },
      },
    });

    if (existingMembership) {
      console.log(`Skipping ${admin.email} - membership already exists`);
      skipped++;
      continue;
    }

    // Create membership with OWNER role
    await prisma.companyMembership.create({
      data: {
        userId: admin.id,
        companyId: admin.companyId!,
        role: "OWNER",
        isPrimary: true,
      },
    });

    console.log(`Created OWNER membership for ${admin.email}`);
    created++;
  }

  console.log("\nMigration complete!");
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
