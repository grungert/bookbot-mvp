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

    // Get all upgrade requests and token purchases for this user
    const [upgradeRequests, tokenPurchases, subscription] = await Promise.all([
      prisma.upgradeRequest.findMany({
        where: {
          userId: user.id,
          status: {
            in: ["APPROVED", "PENDING"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.tokenPurchase.findMany({
        where: {
          userId: user.id,
          status: {
            in: ["APPROVED", "PENDING"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.userSubscription.findUnique({
        where: { userId: user.id },
        include: {
          plan: true,
        },
      }),
    ]);

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

    // Transform token purchases into invoice format
    const tokenInvoices = tokenPurchases.map((purchase, index) => {
      const invoiceNumber = `TOK-${purchase.createdAt.getFullYear()}${String(purchase.createdAt.getMonth() + 1).padStart(2, "0")}-${String(tokenPurchases.length - index).padStart(4, "0")}`;

      const formatTokens = (amount: number) => {
        if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
        if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
        return String(amount);
      };

      return {
        id: purchase.id,
        invoiceNumber,
        planTier: null,
        planDescription: `${purchase.packName} — ${formatTokens(purchase.tokenAmount)} tokens`,
        includeChatbot: false,
        extraCompanyCount: 0,
        basePrice: purchase.priceEurCents / 100,
        chatbotPrice: 0,
        extraCompaniesPrice: 0,
        totalMonthlyPrice: purchase.priceEurCents / 100,
        currency: "EUR",
        status: purchase.status === "APPROVED" ? "PAID" : "PENDING",
        issueDate: purchase.createdAt.toISOString(),
        paidAt: purchase.status === "APPROVED" ? purchase.handledAt?.toISOString() : null,
        autoRenew: false,
        nextBillingDate: null,
        adminNotes: purchase.adminNotes,
        isOneTime: true,
        tokenAmount: purchase.tokenAmount,
      };
    });

    // Merge and sort all invoices by date (newest first)
    const allInvoices = [...invoices, ...tokenInvoices].sort(
      (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );

    return NextResponse.json({
      invoices: allInvoices,
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
