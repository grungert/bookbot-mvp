"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { srLatn, enUS } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type DatePeriod = "7d" | "30d" | "90d" | "all" | "custom";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: "schedule" | "table";
  onViewModeChange: (mode: "schedule" | "table") => void;
  onDateChange: (date: Date) => void;
  onAddAppointment?: () => void;
  // Table view date filter props
  datePeriod?: DatePeriod;
  onDatePeriodChange?: (period: DatePeriod) => void;
  customDateFrom?: string;
  customDateTo?: string;
  onCustomDateChange?: (from: string, to: string) => void;
  primaryColor?: string;
  appointmentCount?: number;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onDateChange,
  onAddAppointment,
  datePeriod = "all",
  onDatePeriodChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
  primaryColor,
  appointmentCount,
}: CalendarHeaderProps) {
  const t = useTranslations("calendar");
  const tAppointments = useTranslations("appointments");
  const locale = useLocale();
  const dateLocale = locale === "sr" ? srLatn : enUS;

  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    customDateFrom && customDateTo
      ? { from: new Date(customDateFrom), to: new Date(customDateTo) }
      : undefined
  );

  const goToPreviousWeek = () => onDateChange(subWeeks(currentDate, 1));
  const goToNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const goToToday = () => onDateChange(new Date());

  // Check if we're currently viewing the week containing today
  const isCurrentWeek = useMemo(() => {
    return isSameWeek(currentDate, new Date(), { weekStartsOn: 1 });
  }, [currentDate]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Date Navigation - Different based on view mode */}
      {viewMode === "schedule" ? (
        // Schedule View: Week Navigation
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
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
          {/* Today button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            disabled={isCurrentWeek}
            className="h-9"
          >
            {t("today")}
          </Button>
        </div>
      ) : (
        // Table View: Date Period Filter
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
            {([
              { value: "all" as DatePeriod, label: tAppointments("allTime") },
              { value: "7d" as DatePeriod, label: tAppointments("days7") },
              { value: "30d" as DatePeriod, label: tAppointments("days30") },
              { value: "90d" as DatePeriod, label: tAppointments("days90") },
            ] as const).map((period) => (
              <button
                key={period.value}
                onClick={() => onDatePeriodChange?.(period.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  datePeriod === period.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {period.label}
              </button>
            ))}
            <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all inline-flex items-center gap-1.5",
                    datePeriod === "custom"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {datePeriod === "custom" && customDateFrom && customDateTo
                      ? `${format(new Date(customDateFrom), "MMM d", { locale: dateLocale })} - ${format(new Date(customDateTo), "MMM d", { locale: dateLocale })}`
                      : tAppointments("custom")}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">{tAppointments("selectDateRange")}</p>
                </div>
                <div
                  className="[&_[data-selected-single=true]]:!bg-[var(--calendar-primary)] [&_[data-range-start=true]]:!bg-[var(--calendar-primary)] [&_[data-range-end=true]]:!bg-[var(--calendar-primary)]"
                  style={{ "--calendar-primary": primaryColor || "hsl(var(--primary))" } as React.CSSProperties}
                >
                  <CalendarPicker
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={dateLocale}
                  />
                </div>
                <div className="p-3 border-t flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {dateRange?.from && (
                      <span>
                        {format(dateRange.from, "MMM d, yyyy", { locale: dateLocale })}
                        {dateRange?.to && (
                          <> → {format(dateRange.to, "MMM d, yyyy", { locale: dateLocale })}</>
                        )}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (dateRange?.from && dateRange?.to) {
                        onCustomDateChange?.(
                          format(dateRange.from, "yyyy-MM-dd"),
                          format(dateRange.to, "yyyy-MM-dd")
                        );
                        onDatePeriodChange?.("custom");
                        setIsCustomDateOpen(false);
                      }
                    }}
                    disabled={!dateRange?.from || !dateRange?.to}
                    style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                  >
                    {tAppointments("apply")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {/* Appointment count */}
          {appointmentCount !== undefined && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {appointmentCount} {appointmentCount === 1 ? tAppointments("appointment") : tAppointments("appointmentsCount")}
            </span>
          )}
        </div>
      )}

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
