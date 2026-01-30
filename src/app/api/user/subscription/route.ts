import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.userSubscription.findUnique({
    where: { userId: user.id },
    include: { plan: true },
  });

  const companyCount = await prisma.companyMembership.count({
    where: { userId: user.id },
  });

  return NextResponse.json({
    tier: subscription?.plan?.tier || "TRIAL",
    status: subscription?.status || "TRIALING",
    hasChatbot: subscription?.hasChatbot || false,
    companyCount,
  });
}
