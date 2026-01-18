import type { ChatMessage, ParsedMessage, RichMessage, ChatUIComponent } from "./types";

// Known valid UI components
const VALID_UI_COMPONENTS = new Set([
  "service-selector",
  "date-picker",
  "time-slots",
  "booking-card",
]);

/**
 * Recursively extract plain text from potentially nested JSON
 * The LLM sometimes outputs nested JSON when it shouldn't
 */
function extractPlainText(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("{")) {
    return text;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && parsed.type === "rich" && typeof parsed.text === "string") {
      // Recursively extract in case of multiple nesting levels
      return extractPlainText(parsed.text);
    }
    return text;
  } catch {
    return text;
  }
}

/**
 * Try to fix common JSON malformations from LLM output
 */
function tryFixMalformedJson(jsonStr: string): string {
  let fixed = jsonStr;

  // Fix extra quotes around JSON (e.g., '"{\"type\":..."')
  if (fixed.startsWith('"') && fixed.endsWith('"')) {
    try {
      // It might be a double-encoded string
      const unquoted = JSON.parse(fixed);
      if (typeof unquoted === "string") {
        fixed = unquoted;
      }
    } catch {
      // Not double-encoded, try removing outer quotes
      fixed = fixed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }

  // Fix escaped quotes that shouldn't be escaped
  // Pattern: \"text\" -> "text" (but only at the start/end of values)
  fixed = fixed.replace(/\\"/g, '"');

  return fixed;
}

/**
 * Extract text content from malformed JSON-like content
 * When JSON parsing fails, try to extract just the text portion
 */
function extractTextFromMalformedJson(content: string): string | null {
  // Try to find "text": "..." pattern
  const textMatch = content.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (textMatch && textMatch[1]) {
    // Unescape the extracted text
    return textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  return null;
}

/**
 * Check if content looks like JSON (starts with { and contains JSON-like patterns)
 */
function looksLikeJson(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith("{") && (
    trimmed.includes('"type"') ||
    trimmed.includes('"text"') ||
    trimmed.includes('"ui"')
  );
}

/**
 * Clean up display text - remove markdown artifacts if they look broken
 */
function cleanDisplayText(text: string): string {
  // Remove leading/trailing whitespace
  let cleaned = text.trim();

  // If text still looks like JSON, try to extract readable content
  if (looksLikeJson(cleaned)) {
    const extracted = extractTextFromMalformedJson(cleaned);
    if (extracted) {
      cleaned = extracted;
    }
  }

  return cleaned;
}

/**
 * Parse a chat message to extract text and optional UI component.
 * Rich messages are stored as JSON strings with { type: "rich", text, ui } structure.
 * Plain text messages are returned as-is.
 *
 * IMPORTANT: This parser will NEVER return raw JSON to the user. If parsing fails,
 * it will extract readable text or return a fallback message.
 */
export function parseMessage(message: ChatMessage): ParsedMessage {
  const { role, content } = message;
  const trimmed = content.trim();

  // Try to parse as JSON rich message
  if (trimmed.startsWith("{")) {
    // First, try to fix common malformations
    const fixedJson = tryFixMalformedJson(trimmed);

    try {
      const parsed = JSON.parse(fixedJson);

      // Validate it's a rich message structure
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.type === "rich" &&
        typeof parsed.text === "string"
      ) {
        const richMessage = parsed as RichMessage;

        // Recursively clean the text in case it contains nested JSON
        const cleanText = extractPlainText(richMessage.text);

        // Only include UI if component is valid
        const ui = richMessage.ui &&
          typeof richMessage.ui.component === "string" &&
          VALID_UI_COMPONENTS.has(richMessage.ui.component)
            ? (richMessage.ui as ChatUIComponent)
            : undefined;

        return {
          role,
          text: cleanText,
          ui,
        };
      }
    } catch {
      // JSON parsing failed - try to extract text portion
    }

    // If we get here, JSON parsing failed or structure was invalid
    // Try to extract the text field from the malformed JSON
    const extractedText = extractTextFromMalformedJson(trimmed);
    if (extractedText) {
      return {
        role,
        text: extractedText,
      };
    }

    // Last resort: if it looks like JSON but we can't parse it,
    // return a generic message instead of raw JSON
    if (looksLikeJson(trimmed)) {
      return {
        role,
        text: role === "assistant"
          ? "I apologize, but there was an issue displaying my response. Please try again."
          : content, // For user messages, show as-is
      };
    }
  }

  // Plain text message - but still clean it
  return {
    role,
    text: cleanDisplayText(content),
  };
}

/**
 * Check if a message contains a UI component
 */
export function hasUIComponent(message: ChatMessage): boolean {
  const parsed = parseMessage(message);
  return parsed.ui !== undefined;
}

/**
 * Create a rich message content string
 */
export function createRichMessageContent(
  text: string,
  ui: RichMessage["ui"]
): string {
  const richMessage: RichMessage = {
    type: "rich",
    text,
    ui,
  };
  return JSON.stringify(richMessage);
}
