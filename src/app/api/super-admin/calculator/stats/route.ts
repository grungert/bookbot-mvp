import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface UsageStats {
  // From ChatMessage - real averages
  avgInputTokensPerMessage: number;
  avgOutputTokensPerMessage: number;
  totalMessages: number;

  // From ChatUsage - monthly patterns
  avgMessagesPerUserMonth: number;
  avgTokensPerUserMonth: number;

  // From Documents
  avgDocsPerCompany: number;
  avgTokensPerDoc: number;
  totalDocuments: number;

  // From Subscriptions/Companies
  totalCustomers: number;
  proCustomers: number;
  businessCustomers: number;
  proChatbotCustomers: number;

  // Calculated percentages
  proPercent: number;
  businessPercent: number;
  proChatbotPercent: number;

  // System prompt analysis
  baseSystemPromptTokens: number;
  avgSystemPromptTokens: number;
  avgFirstMessageInputTokens: number;

  // Time range of data
  dataStartDate: string;
  dataEndDate: string;
  sampleSize: number;
}

// GET real usage statistics from the database
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Average tokens per message (from assistant responses)
    const messageStats = await prisma.chatMessage.aggregate({
      where: {
        role: "assistant",
        inputTokens: { not: null },
        outputTokens: { not: null },
      },
      _avg: {
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
    });

    // 2. Get date range of message data
    const dateRange = await prisma.chatMessage.aggregate({
      where: {
        role: "assistant",
        inputTokens: { not: null },
      },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    // 3. Average messages and tokens per user per month from ChatUsage
    const usageStats = await prisma.chatUsage.aggregate({
      _avg: {
        messageCount: true,
        tokenCount: true,
      },
    });

    // 4. Documents per company
    const companiesWithDocs = await prisma.company.findMany({
      select: {
        id: true,
        _count: {
          select: { documents: true },
        },
      },
    });

    const totalCompanies = companiesWithDocs.length;
    const totalDocuments = companiesWithDocs.reduce(
      (sum, c) => sum + c._count.documents,
      0
    );
    const avgDocsPerCompany =
      totalCompanies > 0 ? totalDocuments / totalCompanies : 0;

    // 5. Average tokens per document (estimate based on content length)
    // Using a rough estimate of 4 characters per token
    const documents = await prisma.document.findMany({
      select: { content: true },
      take: 100, // Sample for performance
    });

    const avgCharsPerDoc =
      documents.length > 0
        ? documents.reduce((sum, d) => sum + d.content.length, 0) /
          documents.length
        : 0;
    const avgTokensPerDoc = Math.round(avgCharsPerDoc / 4); // Rough token estimate

    // 6. Customer distribution from active subscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: {
        plan: true,
      },
    });

    const totalCustomers = subscriptions.length;
    const proCustomers = subscriptions.filter(
      (s) => s.plan.tier === "PRO"
    ).length;
    const businessCustomers = subscriptions.filter(
      (s) => s.plan.tier === "BUSINESS"
    ).length;
    const proChatbotCustomers = subscriptions.filter(
      (s) => s.plan.tier === "PRO" && s.hasChatbot
    ).length;

    // Calculate percentages
    const proPercent =
      totalCustomers > 0
        ? Math.round((proCustomers / totalCustomers) * 100)
        : 80;
    const businessPercent =
      totalCustomers > 0
        ? Math.round((businessCustomers / totalCustomers) * 100)
        : 20;
    const proChatbotPercent =
      proCustomers > 0
        ? Math.round((proChatbotCustomers / proCustomers) * 100)
        : 50;

    // 7. Estimate first message input tokens (system prompt overhead)
    // Get a sample of the first messages in conversations to estimate system prompt size
    // First messages have the system prompt included in inputTokens
    const sessions = await prisma.chatSession.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    let avgFirstMessageInputTokens = 0;
    if (sessions.length > 0) {
      const firstMessages = await prisma.chatMessage.findMany({
        where: {
          sessionId: { in: sessions.map((s) => s.id) },
          role: "assistant",
          inputTokens: { not: null },
        },
        orderBy: { createdAt: "asc" },
        distinct: ["sessionId"],
        select: { inputTokens: true },
      });

      if (firstMessages.length > 0) {
        avgFirstMessageInputTokens = Math.round(
          firstMessages.reduce((sum, m) => sum + (m.inputTokens || 0), 0) /
            firstMessages.length
        );
      }
    }

    // Estimate base system prompt (without documents) - approximately 500-800 tokens
    // The difference between first message and average message gives us document context
    const baseSystemPromptTokens = 600;
    const avgSystemPromptTokens =
      avgFirstMessageInputTokens > 0
        ? avgFirstMessageInputTokens
        : baseSystemPromptTokens + avgTokensPerDoc * avgDocsPerCompany;

    const stats: UsageStats = {
      // Message stats
      avgInputTokensPerMessage: Math.round(messageStats._avg.inputTokens || 200),
      avgOutputTokensPerMessage: Math.round(
        messageStats._avg.outputTokens || 400
      ),
      totalMessages: messageStats._count,

      // Usage patterns
      avgMessagesPerUserMonth: Math.round(usageStats._avg.messageCount || 500),
      avgTokensPerUserMonth: Math.round(usageStats._avg.tokenCount || 50000),

      // Documents
      avgDocsPerCompany: Math.round(avgDocsPerCompany * 10) / 10,
      avgTokensPerDoc,
      totalDocuments,

      // Customer distribution
      totalCustomers,
      proCustomers,
      businessCustomers,
      proChatbotCustomers,

      // Percentages
      proPercent,
      businessPercent,
      proChatbotPercent,

      // System prompt analysis
      baseSystemPromptTokens,
      avgSystemPromptTokens,
      avgFirstMessageInputTokens,

      // Data range
      dataStartDate: dateRange._min.createdAt?.toISOString() || "",
      dataEndDate: dateRange._max.createdAt?.toISOString() || "",
      sampleSize: messageStats._count,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
