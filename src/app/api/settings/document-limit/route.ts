import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DEFAULT_MAX_DOCUMENT_TOKENS, DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS } from "@/lib/document-tokens";

// GET /api/settings/document-limit
// Public endpoint to fetch token limits
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ["MAX_DOCUMENT_TOKENS", "MAX_CUSTOM_INSTRUCTIONS_TOKENS"] },
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    const maxDocumentTokens = settingsMap.MAX_DOCUMENT_TOKENS
      ? parseInt(settingsMap.MAX_DOCUMENT_TOKENS, 10)
      : DEFAULT_MAX_DOCUMENT_TOKENS;

    const maxCustomInstructionsTokens = settingsMap.MAX_CUSTOM_INSTRUCTIONS_TOKENS
      ? parseInt(settingsMap.MAX_CUSTOM_INSTRUCTIONS_TOKENS, 10)
      : DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS;

    return NextResponse.json({
      maxTokens: isNaN(maxDocumentTokens) ? DEFAULT_MAX_DOCUMENT_TOKENS : maxDocumentTokens,
      maxCustomInstructionsTokens: isNaN(maxCustomInstructionsTokens) ? DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS : maxCustomInstructionsTokens,
    });
  } catch (error) {
    console.error("Error fetching token limits:", error);
    // Return defaults on error
    return NextResponse.json({
      maxTokens: DEFAULT_MAX_DOCUMENT_TOKENS,
      maxCustomInstructionsTokens: DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS,
    });
  }
}
