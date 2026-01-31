import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../styles/theme";

interface CodeSnippetProps {
  code: string;
  startFrame: number;
  typingDuration?: number;
  showCopied?: boolean;
  copiedStartFrame?: number;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
  code,
  startFrame,
  typingDuration = 60,
  showCopied = false,
  copiedStartFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // Block scale in animation
  const blockScale = spring({
    fps,
    frame: localFrame,
    config: { damping: 15, stiffness: 80 },
  });

  const blockOpacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typing animation
  const typingProgress = interpolate(localFrame, [20, 20 + typingDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const visibleChars = Math.floor(code.length * typingProgress);
  const displayCode = code.slice(0, visibleChars);
  const showCursor = visibleChars < code.length;

  // Cursor blink
  const cursorOpacity = Math.floor(localFrame / 15) % 2 === 0 ? 1 : 0;

  // Copy button animation
  const copyFrame = frame - copiedStartFrame;
  const copyScale = showCopied && copyFrame > 0
    ? spring({
        fps,
        frame: copyFrame,
        config: { damping: 10, stiffness: 100 },
      })
    : 1;

  // Syntax highlighting
  const highlightCode = (text: string) => {
    // Simple syntax highlighting for HTML
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Match patterns
    const patterns = [
      { regex: /^(<\/?script)/, color: "#ff79c6" }, // Tags
      { regex: /^(src)/, color: "#50fa7b" }, // Attributes
      { regex: /^(=)/, color: "#f8f8f2" }, // Equals
      { regex: /^("[^"]*")/, color: "#f1fa8c" }, // Strings
      { regex: /^(>|<\/?>)/, color: "#ff79c6" }, // Brackets
    ];

    while (remaining.length > 0) {
      let matched = false;

      for (const { regex, color } of patterns) {
        const match = remaining.match(regex);
        if (match) {
          parts.push(
            <span key={key++} style={{ color }}>
              {match[1]}
            </span>
          );
          remaining = remaining.slice(match[1].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Default color for unmatched characters
        parts.push(
          <span key={key++} style={{ color: "#f8f8f2" }}>
            {remaining[0]}
          </span>
        );
        remaining = remaining.slice(1);
      }
    }

    return parts;
  };

  return (
    <div
      style={{
        opacity: blockOpacity,
        transform: `scale(${interpolate(blockScale, [0, 1], [0.9, 1])})`,
      }}
    >
      {/* Code block container */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          borderRadius: 16,
          padding: "24px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
          minWidth: 600,
        }}
      >
        {/* Window dots */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            display: "flex",
            gap: 8,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27ca40" }} />
        </div>

        {/* Code content */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 18,
            lineHeight: 1.6,
            marginTop: 20,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#6272a4", marginRight: 16 }}>1</span>
          <span>{highlightCode(displayCode)}</span>
          {showCursor && (
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: 20,
                background: "#f8f8f2",
                marginLeft: 2,
                opacity: cursorOpacity,
              }}
            />
          )}
        </div>

        {/* Copy button */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transform: `scale(${copyScale})`,
          }}
        >
          {showCopied && copyFrame > 0 ? (
            <>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="#27ca40">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span style={{ color: "#27ca40", fontFamily: fonts.primary, fontSize: 14, fontWeight: 500 }}>
                Copied!
              </span>
            </>
          ) : (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="#6272a4">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
