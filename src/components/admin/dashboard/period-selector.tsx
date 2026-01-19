"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DashboardPeriod } from "@/lib/db/tenant";

interface PeriodSelectorProps {
  currentPeriod: DashboardPeriod | "custom";
  customStartDate?: string;
  customEndDate?: string;
  primaryColor?: string;
  translations: {
    period7d: string;
    period30d: string;
    period90d: string;
    period1y: string;
    periodCustom: string;
    selectDateRange: string;
    from: string;
    to: string;
    apply: string;
  };
}

const periods: { value: DashboardPeriod; key: keyof Pick<PeriodSelectorProps["translations"], "period7d" | "period30d" | "period90d" | "period1y"> }[] = [
  { value: "7d", key: "period7d" },
  { value: "30d", key: "period30d" },
  { value: "90d", key: "period90d" },
  { value: "1y", key: "period1y" },
];

export function PeriodSelector({
  currentPeriod,
  customStartDate,
  customEndDate,
  primaryColor,
  translations,
}: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (customStartDate && customEndDate) {
      return {
        from: new Date(customStartDate),
        to: new Date(customEndDate),
      };
    }
    return undefined;
  });

  const handlePeriodChange = (period: DashboardPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.delete("startDate");
    params.delete("endDate");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCustomDateApply = () => {
    if (dateRange?.from && dateRange?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", "custom");
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
      params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
      router.push(`${pathname}?${params.toString()}`);
      setIsOpen(false);
    }
  };

  const isCustomActive = currentPeriod === "custom";
  const displayDateRange = isCustomActive && customStartDate && customEndDate
    ? `${format(new Date(customStartDate), "MMM d")} - ${format(new Date(customEndDate), "MMM d")}`
    : translations.periodCustom;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handlePeriodChange(period.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            currentPeriod === period.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {translations[period.key]}
        </button>
      ))}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all inline-flex items-center gap-1.5",
              isCustomActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{displayDateRange}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">{translations.selectDateRange}</p>
          </div>
          <div
            className="[&_[data-selected-single=true]]:!bg-[var(--calendar-primary)] [&_[data-range-start=true]]:!bg-[var(--calendar-primary)] [&_[data-range-end=true]]:!bg-[var(--calendar-primary)] [&_.rdp-range_start]:!bg-[var(--calendar-primary)]/10 [&_.rdp-range_end]:!bg-[var(--calendar-primary)]/10"
            style={{ "--calendar-primary": primaryColor || "hsl(var(--primary))" } as React.CSSProperties}
          >
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              disabled={{ after: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) }}
            />
          </div>
          <div className="p-3 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {dateRange?.from && (
                <span>
                  {translations.from}: {format(dateRange.from, "MMM d, yyyy")}
                  {dateRange?.to && (
                    <> &rarr; {translations.to}: {format(dateRange.to, "MMM d, yyyy")}</>
                  )}
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleCustomDateApply}
              disabled={!dateRange?.from || !dateRange?.to}
              style={primaryColor ? { backgroundColor: primaryColor } : undefined}
            >
              {translations.apply}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
