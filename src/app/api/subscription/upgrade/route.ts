import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendUpgradeRequestUserEmail, sendUpgradeRequestAdminEmail } from "@/lib/email/send";

// Generate a unique payment reference
function generatePaymentReference(userId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const userIdPart = userId.slice(-4).toUpperCase();
  return `BB-${userIdPart}-${timestamp}`;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { includeChatbot, extraCompanyCount } = body;

    // Validate inputs
    if (typeof includeChatbot !== "boolean") {
      return NextResponse.json(
        { error: "Invalid chatbot option" },
        { status: 400 }
      );
    }

    const companyCount = Math.max(0, Math.min(10, parseInt(extraCompanyCount) || 0));

    // Check for existing pending request
    const existingRequest = await prisma.upgradeRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "You already have a pending upgrade request",
          code: "EXISTING_PENDING_REQUEST",
          requestId: existingRequest.id,
        },
        { status: 400 }
      );
    }

    // Get current pricing
    const pricingConfigs = await prisma.pricingConfig.findMany({
      where: { isActive: true },
    });

    const pricing: Record<string, number> = {};
    for (const config of pricingConfigs) {
      pricing[config.key] = config.priceEurCents;
    }

    const basePrice = pricing["PRO_BASE"] || 1000;
    const chatbotPrice = includeChatbot ? (pricing["CHATBOT_ADDON"] || 1000) : 0;
    const extraCompaniesPrice = companyCount * (pricing["EXTRA_COMPANY"] || 700);
    const totalMonthlyPrice = basePrice + chatbotPrice + extraCompaniesPrice;

    // Generate payment reference
    const paymentReference = generatePaymentReference(user.id);

    // Create upgrade request
    const upgradeRequest = await prisma.upgradeRequest.create({
      data: {
        userId: user.id,
        requestedPlanTier: "PRO",
        includeChatbot,
        extraCompanyCount: companyCount,
        basePrice,
        chatbotPrice,
        extraCompaniesPrice,
        totalMonthlyPrice,
        status: "PENDING",
      },
    });

    // Send email to user with bank transfer details
    await sendUpgradeRequestUserEmail({
      userEmail: user.email,
      userName: user.name || user.email,
      planName: "Pro",
      includeChatbot,
      extraCompanyCount: companyCount,
      basePrice,
      chatbotPrice,
      extraCompaniesPrice,
      totalMonthlyPrice,
      paymentReference,
    });

    // Send notification email to super admin
    await sendUpgradeRequestAdminEmail({
      userName: user.name || "",
      userEmail: user.email,
      planName: "Pro",
      includeChatbot,
      extraCompanyCount: companyCount,
      basePrice,
      chatbotPrice,
      extraCompaniesPrice,
      totalMonthlyPrice,
      paymentReference,
      requestId: upgradeRequest.id,
    });

    return NextResponse.json({
      success: true,
      message: "Upgrade request submitted successfully",
      requestId: upgradeRequest.id,
      paymentReference,
      totalMonthlyPrice,
    });
  } catch (error) {
    console.error("Error creating upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to create upgrade request" },
      { status: 500 }
    );
  }
}

// GET endpoint to check user's pending upgrade request
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pendingRequest = await prisma.upgradeRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!pendingRequest) {
      return NextResponse.json({ hasPendingRequest: false });
    }

    return NextResponse.json({
      hasPendingRequest: true,
      request: {
        id: pendingRequest.id,
        includeChatbot: pendingRequest.includeChatbot,
        extraCompanyCount: pendingRequest.extraCompanyCount,
        basePrice: pendingRequest.basePrice,
        chatbotPrice: pendingRequest.chatbotPrice,
        extraCompaniesPrice: pendingRequest.extraCompaniesPrice,
        totalMonthlyPrice: pendingRequest.totalMonthlyPrice,
        createdAt: pendingRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to fetch upgrade request" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel pending upgrade request
export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pendingRequest = await prisma.upgradeRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (!pendingRequest) {
      return NextResponse.json(
        { error: "No pending upgrade request found" },
        { status: 404 }
      );
    }

    await prisma.upgradeRequest.update({
      where: { id: pendingRequest.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Upgrade request cancelled",
    });
  } catch (error) {
    console.error("Error cancelling upgrade request:", error);
    return NextResponse.json(
      { error: "Failed to cancel upgrade request" },
      { status: 500 }
    );
  }
}
