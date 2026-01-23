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

async function main() {
  const email = "admin@test.com";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Update to super admin
    await prisma.user.update({
      where: { email },
      data: {
        role: "SUPER_ADMIN",
        password: hashedPassword,
        emailVerified: new Date()
      }
    });
    console.log("Updated existing user to SUPER_ADMIN:", email);
  } else {
    // Create new super admin
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Super Admin",
        role: "SUPER_ADMIN",
        emailVerified: new Date()
      }
    });
    console.log("Created new SUPER_ADMIN:", email);
  }

  // Verify
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });
  console.log("Super Admin account:", user);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
