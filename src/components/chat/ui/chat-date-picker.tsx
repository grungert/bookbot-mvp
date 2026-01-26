"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ChatDatePickerProps {
  serviceId: string;
  serviceName: string;
  closedDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  onSelect?: (date: Date, serviceId: string, serviceName: string) => void;
  disabled?: boolean;
  preSelectedDate?: Date; // Pre-selected date for historical messages
  animate?: boolean;
}

export function ChatDatePicker({
  serviceId,
  serviceName,
  closedDays = [],
  onSelect,
  disabled = false,
  preSelectedDate,
}: ChatDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    disabled ? preSelectedDate : undefined
  );

  const handleSelect = (date: Date | undefined) => {
    if (date && !disabled) {
      setSelectedDate(date);
      onSelect?.(date, serviceId, serviceName);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={cn("mt-2", disabled && "opacity-60 pointer-events-none")}>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        disabled={(date) => {
          // Disable past dates
          if (date < today) return true;
          // Disable closed days
          if (closedDays.includes(date.getDay())) return true;
          return false;
        }}
        className="rounded-md border bg-background p-2 !w-auto [--cell-size:28px]"
      />
    </div>
  );
}
