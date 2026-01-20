import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create a test COMPANY_ADMIN user
  const testEmail = "testadmin@example.com";

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log("Test admin user already exists:", existingUser.email);
    return;
  }

  // Get an existing company to assign
  const company = await prisma.company.findFirst();

  if (!company) {
    console.log("No companies found. Create a company first.");
    return;
  }

  // Create the test user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Test Admin",
      role: "COMPANY_ADMIN",
      companyId: company.id,
    },
  });

  console.log("Created test admin user:", user.email);

  // Create company membership with OWNER role
  const membership = await prisma.companyMembership.create({
    data: {
      userId: user.id,
      companyId: company.id,
      role: "OWNER",
      isPrimary: true,
    },
  });

  console.log("Created membership for company:", company.name);
  console.log("\nYou can now sign in with:", testEmail);
  console.log("(Use magic link or add a password via Prisma Studio)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
