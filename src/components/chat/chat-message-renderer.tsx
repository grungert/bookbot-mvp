"use client";

import { cn } from "@/lib/utils";
import { parseMessage } from "./message-parser";
import { extractSelectionFromNextMessage } from "./selection-extractor";
import { ChatServiceSelector } from "./ui/chat-service-selector";
import { ChatDatePicker } from "./ui/chat-date-picker";
import { ChatTimeSlots } from "./ui/chat-time-slots";
import { ChatBookingCard } from "./ui/chat-booking-card";
import type { ChatMessage, ChatUICallbacks, ChatService, ChatTimeSlot } from "./types";

interface ChatMessageRendererProps {
  message: ChatMessage;
  nextMessage?: ChatMessage; // Next message in conversation for extracting selections
  isLatest: boolean;
  callbacks?: ChatUICallbacks;
}

export function ChatMessageRenderer({
  message,
  nextMessage,
  isLatest,
  callbacks,
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
        <div className={cn(!isUser && "px-4 py-2")}>{parsed.text}</div>

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
              />
            )}

            {parsed.ui.component === "booking-card" && (
              <ChatBookingCard booking={parsed.ui.props} />
            )}

            {/* Note: Unknown components are filtered out by the message parser */}
          </div>
        )}
      </div>
    </div>
  );
}
