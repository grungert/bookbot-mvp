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
 * Parse a chat message to extract text and optional UI component.
 * Rich messages are stored as JSON strings with { type: "rich", text, ui } structure.
 * Plain text messages are returned as-is.
 */
export function parseMessage(message: ChatMessage): ParsedMessage {
  const { role, content } = message;
  const trimmed = content.trim();

  // Try to parse as JSON rich message
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);

      // Validate it's a rich message structure
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.type === "rich" &&
        typeof parsed.text === "string" &&
        parsed.ui &&
        typeof parsed.ui.component === "string"
      ) {
        const richMessage = parsed as RichMessage;

        // Recursively clean the text in case it contains nested JSON
        const cleanText = extractPlainText(richMessage.text);

        return {
          role,
          text: cleanText,
          ui: richMessage.ui as ChatUIComponent,
        };
      }
    } catch {
      // Not valid JSON, treat as plain text
    }
  }

  // Plain text message
  return {
    role,
    text: content,
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
