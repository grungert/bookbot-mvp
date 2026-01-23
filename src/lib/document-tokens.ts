// Simple token estimation: ~4 characters per token
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export const DEFAULT_MAX_DOCUMENT_TOKENS = 1500; // ~6,000 characters
export const DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS = 500; // ~2,000 characters
