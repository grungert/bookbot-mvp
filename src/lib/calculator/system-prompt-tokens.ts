/**
 * System Prompt Token Calculator
 *
 * Estimates and calculates the token overhead for system prompts in chat conversations.
 * The first message in each conversation includes the system prompt, which contains:
 * - Base instructions and personality
 * - Document context from knowledge base
 * - Service listings
 * - User context (if logged in)
 * - Tool instructions
 */

import { prisma } from "@/lib/prisma";

export interface SystemPromptEstimate {
  basePromptTokens: number;
  documentContextTokens: number;
  servicesContextTokens: number;
  userContextTokens: number;
  toolInstructionsTokens: number;
  totalEstimatedTokens: number;
}

/**
 * Approximate token counts for different parts of the system prompt.
 * These are based on the structure in src/lib/ai/chat.ts
 */
const BASE_PROMPT_TOKENS = 350; // Identity, personality, date/time, booking rules
const TOOL_INSTRUCTIONS_TOKENS = 450; // Tool definitions and usage instructions
const USER_CONTEXT_TOKENS = 100; // Logged-in user info + appointments
const SERVICE_TOKENS_PER_SERVICE = 30; // Average tokens per service listing

/**
 * Estimate tokens in system prompt based on company configuration.
 * Uses the same structure as buildSystemPrompt() in src/lib/ai/chat.ts
 */
export function estimateSystemPromptTokens(params: {
  avgDocsPerCompany: number;
  avgTokensPerDoc: number;
  avgServicesPerCompany?: number;
  includeUserContext?: boolean;
}): SystemPromptEstimate {
  const {
    avgDocsPerCompany,
    avgTokensPerDoc,
    avgServicesPerCompany = 5,
    includeUserContext = true,
  } = params;

  // Document context - documents are included in full
  const documentContextTokens = avgDocsPerCompany * avgTokensPerDoc;

  // Services context
  const servicesContextTokens = avgServicesPerCompany * SERVICE_TOKENS_PER_SERVICE;

  // User context (appointments, email, name) if logged in
  const userContextTokens = includeUserContext ? USER_CONTEXT_TOKENS : 0;

  const totalEstimatedTokens =
    BASE_PROMPT_TOKENS +
    documentContextTokens +
    servicesContextTokens +
    userContextTokens +
    TOOL_INSTRUCTIONS_TOKENS;

  return {
    basePromptTokens: BASE_PROMPT_TOKENS,
    documentContextTokens,
    servicesContextTokens,
    userContextTokens,
    toolInstructionsTokens: TOOL_INSTRUCTIONS_TOKENS,
    totalEstimatedTokens,
  };
}

/**
 * Calculate actual system prompt tokens from database sample.
 * Analyzes the inputTokens of first messages in conversations,
 * which include the full system prompt.
 */
export async function calculateActualSystemPromptTokens(): Promise<{
  avgFirstMessageTokens: number;
  avgSubsequentMessageTokens: number;
  estimatedSystemPromptTokens: number;
  sampleSize: number;
}> {
  // Get recent chat sessions
  const sessions = await prisma.chatSession.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (sessions.length === 0) {
    return {
      avgFirstMessageTokens: 0,
      avgSubsequentMessageTokens: 0,
      estimatedSystemPromptTokens: 0,
      sampleSize: 0,
    };
  }

  const sessionIds = sessions.map((s) => s.id);

  // Get all assistant messages with token data
  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId: { in: sessionIds },
      role: "assistant",
      inputTokens: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      sessionId: true,
      inputTokens: true,
      createdAt: true,
    },
  });

  if (messages.length === 0) {
    return {
      avgFirstMessageTokens: 0,
      avgSubsequentMessageTokens: 0,
      estimatedSystemPromptTokens: 0,
      sampleSize: 0,
    };
  }

  // Group messages by session
  const messagesBySession = new Map<string, typeof messages>();
  for (const msg of messages) {
    const existing = messagesBySession.get(msg.sessionId) || [];
    existing.push(msg);
    messagesBySession.set(msg.sessionId, existing);
  }

  // Calculate first message and subsequent message averages
  let firstMessageTotal = 0;
  let firstMessageCount = 0;
  let subsequentMessageTotal = 0;
  let subsequentMessageCount = 0;

  for (const [, sessionMessages] of messagesBySession) {
    // Sort by createdAt to ensure correct order
    sessionMessages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (let i = 0; i < sessionMessages.length; i++) {
      const tokens = sessionMessages[i].inputTokens || 0;
      if (i === 0) {
        firstMessageTotal += tokens;
        firstMessageCount++;
      } else {
        subsequentMessageTotal += tokens;
        subsequentMessageCount++;
      }
    }
  }

  const avgFirstMessageTokens =
    firstMessageCount > 0 ? Math.round(firstMessageTotal / firstMessageCount) : 0;

  const avgSubsequentMessageTokens =
    subsequentMessageCount > 0
      ? Math.round(subsequentMessageTotal / subsequentMessageCount)
      : 0;

  // The difference between first and subsequent messages estimates the system prompt size
  // (since subsequent messages include conversation history but not the full system prompt overhead)
  // Note: This is an approximation as conversation history grows
  const estimatedSystemPromptTokens = Math.max(
    0,
    avgFirstMessageTokens - avgSubsequentMessageTokens
  );

  return {
    avgFirstMessageTokens,
    avgSubsequentMessageTokens,
    estimatedSystemPromptTokens,
    sampleSize: firstMessageCount,
  };
}

/**
 * Calculate the cost of first message overhead per month.
 * First messages include the full system prompt which adds significant token cost.
 */
export function calculateFirstMessageOverheadCost(params: {
  avgMessagesPerMonth: number;
  avgMessagesPerConversation: number;
  systemPromptTokens: number;
  inputPricePer1M: number;
}): number {
  const {
    avgMessagesPerMonth,
    avgMessagesPerConversation,
    systemPromptTokens,
    inputPricePer1M,
  } = params;

  // Calculate number of conversations per month
  const conversationsPerMonth = avgMessagesPerMonth / avgMessagesPerConversation;

  // Cost of system prompt per conversation
  const systemPromptCostPerConversation =
    (systemPromptTokens / 1_000_000) * inputPricePer1M;

  // Total monthly overhead cost
  return conversationsPerMonth * systemPromptCostPerConversation;
}
