"use client";

import { memo } from "react";
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
import type { ChatMessage } from "./types";

const AdminChatMarkdown = memo(function AdminChatMarkdown({ text }: { text: string }) {
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
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => <div className="border-l-2 border-muted-foreground/30 pl-2 mb-1 last:mb-0">{children}</div>,
        hr: () => <hr className="my-1 border-muted-foreground/20" />,
      }}
    >
      {text}
    </Markdown>
  );
});

interface AdminMessageRendererProps {
  message: ChatMessage;
  nextMessage?: ChatMessage; // Next message in conversation for extracting selections
  timestamp?: string;
  language?: string;
}

/**
 * Admin-specific message renderer for viewing conversation history.
 * All UI components are rendered in read-only/disabled mode.
 */
export function AdminMessageRenderer({
  message,
  nextMessage,
  timestamp,
  language,
}: AdminMessageRendererProps) {
  const parsed = parseMessage(message);
  const isUser = parsed.role === "user";

  // Extract selection context from the next message (user's response)
  const selectionContext = nextMessage?.role === "user"
    ? extractSelectionFromNextMessage(nextMessage.content)
    : {};

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {/* Text content */}
        <div className="px-4 py-2 text-sm">
          {isUser ? (
            <p className="whitespace-pre-wrap">{parsed.text}</p>
          ) : (
            <AdminChatMarkdown text={parsed.text} />
          )}
          {timestamp && (
            <p
              className={cn(
                "text-xs mt-1",
                isUser ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {timestamp}
            </p>
          )}
        </div>

        {/* UI Component (read-only in admin view) */}
        {parsed.ui && (
          <div className="px-2 pb-2">
            {parsed.ui.component === "service-selector" && (
              <ChatServiceSelector
                services={parsed.ui.props.services}
                disabled={true}
                preSelectedServiceName={selectionContext.preSelectedServiceName}
              />
            )}

            {parsed.ui.component === "date-picker" && (
              <ChatDatePicker
                serviceId={parsed.ui.props.serviceId}
                serviceName={parsed.ui.props.serviceName}
                closedDays={parsed.ui.props.closedDays}
                disabled={true}
                preSelectedDate={selectionContext.preSelectedDate}
              />
            )}

            {parsed.ui.component === "time-slots" && (
              <ChatTimeSlots
                serviceId={parsed.ui.props.serviceId}
                serviceName={parsed.ui.props.serviceName}
                date={parsed.ui.props.date}
                dateISO={parsed.ui.props.dateISO}
                slots={parsed.ui.props.slots}
                disabled={true}
                preSelectedTime={selectionContext.preSelectedTime}
                language={language}
              />
            )}

            {parsed.ui.component === "booking-card" && (
              <ChatBookingCard booking={parsed.ui.props} language={language} />
            )}

            {parsed.ui.component === "confirmation" && (
              <ChatConfirmationButtons
                confirmLabel={parsed.ui.props.confirmLabel}
                cancelLabel={parsed.ui.props.cancelLabel}
                disabled={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
