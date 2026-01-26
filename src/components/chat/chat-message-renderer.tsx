"use client";

import { useState, useEffect, memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { parseMessage } from "./message-parser";
import { extractSelectionFromNextMessage } from "./selection-extractor";
import { ChatServiceSelector } from "./ui/chat-service-selector";
import { ChatDatePicker } from "./ui/chat-date-picker";
import { ChatTimeSlots } from "./ui/chat-time-slots";
import { ChatBookingCard } from "./ui/chat-booking-card";
import { ChatConfirmationButtons } from "./ui/chat-confirmation-buttons";
import type { ChatMessage, ChatUICallbacks, ChatService, ChatTimeSlot } from "./types";

function formatSmartTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  // Same week (within 7 days)
  if (diffHour < 168) {
    return date.toLocaleDateString([], { weekday: "short" }) +
      " " +
      date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  // Older
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const ChatMarkdown = memo(function ChatMarkdown({ text }: { text: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1 last:mb-0 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 last:mb-0 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="bg-background/50 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
        ),
        h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
        h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
        h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
        table: ({ children }) => (
          <div className="overflow-x-auto my-1 last:mb-0 rounded border border-muted-foreground/20">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-background/50">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-muted-foreground/10 last:border-0">{children}</tr>,
        th: ({ children }) => <th className="px-2 py-1 text-left font-semibold whitespace-nowrap">{children}</th>,
        td: ({ children }) => <td className="px-2 py-1 whitespace-nowrap">{children}</td>,
        // Block-level elements not suitable for chat
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => <div className="border-l-2 border-muted-foreground/30 pl-2 mb-1 last:mb-0">{children}</div>,
        hr: () => <hr className="my-1 border-muted-foreground/20" />,
      }}
    >
      {text}
    </Markdown>
  );
});

function SmartTimestamp({ timestamp, isUser }: { timestamp: string; isUser?: boolean }) {
  const [display, setDisplay] = useState(() => formatSmartTime(timestamp));

  useEffect(() => {
    // Only set up interval for recent messages (< 1 hour old)
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (diffMs > 3600000) return;

    const interval = setInterval(() => {
      setDisplay(formatSmartTime(timestamp));
    }, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <span className={cn(
      "text-[10px] mt-1 block",
      isUser ? "text-white/70" : "text-muted-foreground/60"
    )}>
      {display}
    </span>
  );
}

interface ChatMessageRendererProps {
  message: ChatMessage;
  nextMessage?: ChatMessage; // Next message in conversation for extracting selections
  isLatest: boolean;
  callbacks?: ChatUICallbacks;
  language?: string;
}

export function ChatMessageRenderer({
  message,
  nextMessage,
  isLatest,
  callbacks,
  language,
}: ChatMessageRendererProps) {
  const parsed = parseMessage(message);
  const isUser = parsed.role === "user";
  const isInteractive = isLatest && !isUser && callbacks;

  // Extract selection context from the next message (user's response)
  const selectionContext = nextMessage?.role === "user"
    ? extractSelectionFromNextMessage(nextMessage.content)
    : {};

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg text-sm",
          isUser ? "bg-primary text-primary-foreground px-4 py-2" : "bg-muted"
        )}
      >
        {/* Text content */}
        <div className={cn(!isUser && "px-4 py-2")}>
          {isUser ? (
            parsed.text
          ) : (
            <ChatMarkdown text={parsed.text} />
          )}
        </div>

        {/* UI Component */}
        {parsed.ui && (
          <div className={cn(!isUser && "px-2 pb-2")}>
            {parsed.ui.component === "service-selector" && (
              <ChatServiceSelector
                services={parsed.ui.props.services}
                onSelect={
                  isInteractive
                    ? (service: ChatService) => callbacks?.onServiceSelect?.(service)
                    : undefined
                }
                disabled={!isInteractive}
                preSelectedServiceName={selectionContext.preSelectedServiceName}
                animate={isLatest}
              />
            )}

            {parsed.ui.component === "date-picker" && (
              <ChatDatePicker
                serviceId={parsed.ui.props.serviceId}
                serviceName={parsed.ui.props.serviceName}
                closedDays={parsed.ui.props.closedDays}
                onSelect={
                  isInteractive
                    ? (date: Date, serviceId: string, serviceName: string) =>
                        callbacks?.onDateSelect?.(date, serviceId, serviceName)
                    : undefined
                }
                disabled={!isInteractive}
                preSelectedDate={selectionContext.preSelectedDate}
                animate={isLatest}
              />
            )}

            {parsed.ui.component === "time-slots" && (
              <ChatTimeSlots
                serviceId={parsed.ui.props.serviceId}
                serviceName={parsed.ui.props.serviceName}
                date={parsed.ui.props.date}
                dateISO={parsed.ui.props.dateISO}
                slots={parsed.ui.props.slots}
                onSelect={
                  isInteractive
                    ? (slot: ChatTimeSlot, serviceId: string, dateISO: string, serviceName: string) =>
                        callbacks?.onTimeSelect?.(slot, serviceId, dateISO, serviceName)
                    : undefined
                }
                disabled={!isInteractive}
                preSelectedTime={selectionContext.preSelectedTime}
                language={language}
                animate={isLatest}
              />
            )}

            {parsed.ui.component === "booking-card" && (
              <ChatBookingCard booking={parsed.ui.props} language={language} animate={isLatest} />
            )}

            {parsed.ui.component === "confirmation" && (() => {
              const confirmProps = parsed.ui!.props as { confirmLabel: string; cancelLabel: string; action: Record<string, unknown> };
              return (
                <ChatConfirmationButtons
                  confirmLabel={confirmProps.confirmLabel}
                  cancelLabel={confirmProps.cancelLabel}
                  onConfirm={isInteractive ? () => callbacks?.onConfirmationClick?.(true, confirmProps.action) : undefined}
                  onCancel={isInteractive ? () => callbacks?.onConfirmationClick?.(false) : undefined}
                  disabled={!isInteractive}
                  animate={isLatest}
                />
              );
            })()}

            {/* Note: Unknown components are filtered out by the message parser */}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className={cn(
            isUser ? "text-right" : "px-4 pb-1.5",
          )}>
            <SmartTimestamp timestamp={message.timestamp} isUser={isUser} />
          </div>
        )}
      </div>
    </div>
  );
}
