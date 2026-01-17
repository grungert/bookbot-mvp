"use client";

import { useTranslations } from "next-intl";
import { format, addWeeks, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: "schedule" | "table";
  onViewModeChange: (mode: "schedule" | "table") => void;
  onDateChange: (date: Date) => void;
  onAddAppointment?: () => void;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onDateChange,
  onAddAppointment,
}: CalendarHeaderProps) {
  const t = useTranslations("calendar");

  const goToPreviousWeek = () => onDateChange(subWeeks(currentDate, 1));
  const goToNextWeek = () => onDateChange(addWeeks(currentDate, 1));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Date Navigation */}
      <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">
          {format(currentDate, "MMMM yyyy")}
        </span>
        <div className="flex items-center ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* View Toggle - Button Group Style */}
        <div className="inline-flex rounded-lg border bg-card p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("schedule")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "schedule"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("schedule")}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "table"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("table")}
          </button>
        </div>

        {/* Add Appointment Button */}
        {onAddAppointment && (
          <Button
            onClick={onAddAppointment}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addAppointment")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
