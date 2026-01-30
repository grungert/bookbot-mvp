import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createOrUpdateUser(
  email: string,
  password: string,
  name: string,
  role: "SUPER_ADMIN" | "USER"
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role,
        password: hashedPassword,
        name,
        emailVerified: new Date()
      }
    });
    console.log(`Updated existing user to ${role}:`, email);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        emailVerified: new Date()
      }
    });
    console.log(`Created new ${role}:`, email);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });
  console.log("Account:", user);
  return user;
}

async function main() {
  console.log("Creating test users...\n");

  // Super admin users
  await createOrUpdateUser("admin@test.com", "password123", "Super Admin", "SUPER_ADMIN");
  await createOrUpdateUser("testadmin@example.com", "password123", "Test Admin", "SUPER_ADMIN");

  // Regular user
  await createOrUpdateUser("user@test.com", "password123", "Test User", "USER");

  console.log("\nAll test users created!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
