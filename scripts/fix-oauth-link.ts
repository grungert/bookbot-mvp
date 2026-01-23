import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Investigating OAuth Account Links ===\n");

  // 1. Find all Google OAuth accounts
  const googleAccounts = await prisma.account.findMany({
    where: { provider: "google" },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  console.log("Google OAuth accounts in database:");
  if (googleAccounts.length === 0) {
    console.log("  No Google accounts linked\n");
  } else {
    for (const acc of googleAccounts) {
      console.log(`  - Account ID: ${acc.id}`);
      console.log(`    Provider Account ID: ${acc.providerAccountId}`);
      console.log(`    Linked to User: ${acc.user.email} (${acc.user.name})`);
      console.log(`    User ID: ${acc.user.id}\n`);
    }
  }

  // 2. Check for testadmin user
  const testAdmin = await prisma.user.findFirst({
    where: { email: { contains: "testadmin" } },
    include: {
      accounts: true,
    },
  });

  if (testAdmin) {
    console.log("=== Test Admin User Found ===");
    console.log(`  Email: ${testAdmin.email}`);
    console.log(`  ID: ${testAdmin.id}`);
    console.log(`  Linked accounts: ${testAdmin.accounts.length}`);
    for (const acc of testAdmin.accounts) {
      console.log(`    - ${acc.provider}: ${acc.providerAccountId}`);
    }
    console.log("");
  }

  // 3. Check for your actual user
  const bojanUser = await prisma.user.findFirst({
    where: { email: { contains: "bojan" } },
    include: {
      accounts: true,
    },
  });

  if (bojanUser) {
    console.log("=== Bojan User Found ===");
    console.log(`  Email: ${bojanUser.email}`);
    console.log(`  ID: ${bojanUser.id}`);
    console.log(`  Linked accounts: ${bojanUser.accounts.length}`);
    for (const acc of bojanUser.accounts) {
      console.log(`    - ${acc.provider}: ${acc.providerAccountId}`);
    }
    console.log("");
  }

  // Ask for confirmation before fixing
  console.log("=== To Fix ===");
  console.log("Run this script with --fix flag to:");
  console.log("1. Delete any Google account linked to testadmin@example.com");
  console.log("2. This will allow you to log in fresh with your Gmail\n");

  if (process.argv.includes("--fix")) {
    console.log("=== Applying Fix ===");

    // Delete Google accounts linked to test users
    const deleted = await prisma.account.deleteMany({
      where: {
        provider: "google",
        user: {
          email: { contains: "testadmin" },
        },
      },
    });

    console.log(`Deleted ${deleted.count} Google account link(s) from test users.`);
    console.log("\nNow log out and log in again with Google.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
