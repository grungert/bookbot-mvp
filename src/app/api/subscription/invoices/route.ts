import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Bank settings keys
const BANK_SETTINGS_KEYS = [
  "BANK_NAME",
  "BANK_ACCOUNT_NAME",
  "BANK_IBAN",
  "BANK_BIC",
];

// GET subscription invoices for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all upgrade requests for this user (approved ones are "paid" invoices)
    const upgradeRequests = await prisma.upgradeRequest.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["APPROVED", "PENDING"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user's subscription for autorenew info
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
      include: {
        plan: true,
      },
    });

    // Fetch bank settings for invoice display
    const bankSettings: Record<string, string> = {};
    try {
      const settings = await prisma.systemSettings.findMany({
        where: {
          key: { in: BANK_SETTINGS_KEYS },
        },
        select: {
          key: true,
          value: true,
        },
      });
      for (const setting of settings) {
        bankSettings[setting.key] = setting.value;
      }
    } catch {
      // If settings not available, leave empty
    }

    // Transform upgrade requests into invoice format
    const invoices = upgradeRequests.map((request, index) => {
      // Generate invoice number from request
      const invoiceNumber = `SUB-${request.createdAt.getFullYear()}${String(request.createdAt.getMonth() + 1).padStart(2, "0")}-${String(upgradeRequests.length - index).padStart(4, "0")}`;

      // Build plan description
      const planDetails: string[] = [];
      planDetails.push(request.requestedPlanTier);
      if (request.includeChatbot && request.requestedPlanTier === "PRO") {
        planDetails.push("AI Chatbot");
      }
      if (request.extraCompanyCount > 0) {
        planDetails.push(`+${request.extraCompanyCount} companies`);
      }

      return {
        id: request.id,
        invoiceNumber,
        planTier: request.requestedPlanTier,
        planDescription: planDetails.join(" + "),
        includeChatbot: request.includeChatbot,
        extraCompanyCount: request.extraCompanyCount,
        // Pricing in EUR (cents to euros)
        basePrice: request.basePrice / 100,
        chatbotPrice: request.chatbotPrice / 100,
        extraCompaniesPrice: request.extraCompaniesPrice / 100,
        totalMonthlyPrice: request.totalMonthlyPrice / 100,
        currency: "EUR",
        status: request.status === "APPROVED" ? "PAID" : "PENDING",
        issueDate: request.createdAt.toISOString(),
        paidAt: request.status === "APPROVED" ? request.handledAt?.toISOString() : null,
        // AutoRenew based on subscription status
        autoRenew: subscription?.status === "ACTIVE",
        // Next billing date
        nextBillingDate: subscription?.currentPeriodEnd?.toISOString() || null,
        // Admin notes if any
        adminNotes: request.adminNotes,
      };
    });

    return NextResponse.json({
      invoices,
      subscription: subscription ? {
        status: subscription.status,
        planTier: subscription.plan.tier,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        hasChatbot: subscription.hasChatbot,
        extraCompanySlots: subscription.extraCompanySlots,
      } : null,
      user: {
        name: user.name,
        email: user.email,
      },
      bankDetails: {
        bankName: bankSettings["BANK_NAME"] || "",
        accountName: bankSettings["BANK_ACCOUNT_NAME"] || "",
        iban: bankSettings["BANK_IBAN"] || "",
        bic: bankSettings["BANK_BIC"] || "",
      },
    });
  } catch (error) {
    console.error("Error fetching subscription invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription invoices" },
      { status: 500 }
    );
  }
}
