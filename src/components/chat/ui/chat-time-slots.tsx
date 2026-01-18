"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatTimeSlot } from "../types";

interface ChatTimeSlotsProps {
  serviceId: string;
  serviceName: string;
  date: string; // Display date
  dateISO: string; // ISO date for creating bookings
  slots: ChatTimeSlot[];
  onSelect?: (slot: ChatTimeSlot, serviceId: string, dateISO: string, serviceName: string) => void;
  disabled?: boolean;
}

export function ChatTimeSlots({
  serviceId,
  serviceName,
  dateISO,
  slots,
  onSelect,
  disabled = false,
}: ChatTimeSlotsProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleSelect = (slot: ChatTimeSlot) => {
    setSelectedTime(slot.startTime);
    onSelect?.(slot, serviceId, dateISO, serviceName);
  };

  if (slots.length === 0) {
    return (
      <div className="mt-2 p-3 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
        No available time slots for this date.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-2 grid grid-cols-3 gap-1.5 max-w-[280px]",
        disabled && "pointer-events-none"
      )}
    >
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.startTime;

        return (
          <Button
            key={slot.startTime}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect(slot)}
            disabled={disabled && !isSelected}
            className={cn(
              "text-xs h-8 px-2",
              disabled && !isSelected && "opacity-40",
              isSelected && "bg-primary text-primary-foreground"
            )}
          >
            {isSelected && <Check className="h-3 w-3 mr-1" />}
            {slot.displayTime}
          </Button>
        );
      })}
    </div>
  );
}
