"use client";

import { cn } from "@/lib/utils";
import { parseMessage } from "./message-parser";
import { extractSelectionFromNextMessage } from "./selection-extractor";
import { ChatServiceSelector } from "./ui/chat-service-selector";
import { ChatDatePicker } from "./ui/chat-date-picker";
import { ChatTimeSlots } from "./ui/chat-time-slots";
import { ChatBookingCard } from "./ui/chat-booking-card";
import { ChatConfirmationButtons } from "./ui/chat-confirmation-buttons";
import type { ChatMessage } from "./types";

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
        <div className="px-4 py-2">
          <p className="text-sm whitespace-pre-wrap">{parsed.text}</p>
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
