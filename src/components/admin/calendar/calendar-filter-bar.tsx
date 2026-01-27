"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment } from "./appointment-card";

export interface Service {
  id: string;
  name: string;
  color?: string | null;
  duration?: number;
}

export interface FilterState {
  services: string[];
  statuses: string[];
}

interface CalendarFilterBarProps {
  services: Service[];
  appointments: Appointment[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
  // Search props (only shown in table view)
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const ALL_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

// Status color configuration for dropdown - only text and border colors change
const STATUS_STYLES: Record<string, { text: string; border: string; itemBg: string }> = {
  all: {
    text: "text-primary",
    border: "border-primary/30 hover:border-primary/50",
    itemBg: "bg-primary/10",
  },
  PENDING: {
    text: "text-orange-700",
    border: "border-orange-500/50 hover:border-orange-500/70",
    itemBg: "bg-orange-500/10",
  },
  CONFIRMED: {
    text: "text-green-700",
    border: "border-green-500/50 hover:border-green-500/70",
    itemBg: "bg-green-500/10",
  },
  COMPLETED: {
    text: "text-blue-700",
    border: "border-blue-500/50 hover:border-blue-500/70",
    itemBg: "bg-blue-500/10",
  },
  CANCELLED: {
    text: "text-red-700",
    border: "border-red-500/50 hover:border-red-500/70",
    itemBg: "bg-red-500/10",
  },
};

export function CalendarFilterBar({
  services,
  appointments,
  filters,
  onFiltersChange,
  className,
  showSearch = false,
  searchQuery = "",
  onSearchChange,
}: CalendarFilterBarProps) {
  const t = useTranslations("calendar");
  const tAppointments = useTranslations("appointments");

  // Count appointments per service
  const serviceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach((s) => counts.set(s.id, 0));
    appointments.forEach((apt) => {
      if (apt.service?.id) {
        const current = counts.get(apt.service.id) || 0;
        counts.set(apt.service.id, current + 1);
      }
    });
    return counts;
  }, [services, appointments]);

  // Get current status filter value for dropdown
  const currentStatusValue = useMemo(() => {
    if (filters.statuses.length === ALL_STATUSES.length || filters.statuses.length === 0) {
      return "all";
    }
    if (filters.statuses.length === 1) {
      return filters.statuses[0];
    }
    return "all"; // Default to all if multiple but not all selected
  }, [filters.statuses]);

  // Get the style for the current status
  const currentStatusStyle = STATUS_STYLES[currentStatusValue] || STATUS_STYLES.all;

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ ...filters, statuses: [...ALL_STATUSES] });
    } else {
      onFiltersChange({ ...filters, statuses: [value] });
    }
  };

  const toggleService = (serviceId: string) => {
    const isSelected = filters.services.includes(serviceId);
    let newServices: string[];

    if (isSelected) {
      // If it's the only one selected, don't deselect
      if (filters.services.length === 1) {
        return;
      }
      newServices = filters.services.filter((id) => id !== serviceId);
    } else {
      newServices = [...filters.services, serviceId];
    }

    onFiltersChange({ ...filters, services: newServices });
  };

  const selectAllServices = () => {
    onFiltersChange({ ...filters, services: services.map((s) => s.id) });
  };

  const allServicesSelected = filters.services.length === services.length;

  return (
    <div className={cn("flex items-center justify-between gap-4 flex-wrap", className)}>
      {/* Left side - Status filter dropdown and search */}
      <div className="flex items-center gap-3">
        <Select value={currentStatusValue} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={cn(
              "w-[180px] bg-white backdrop-blur-sm transition-colors",
              currentStatusStyle.text,
              currentStatusStyle.border
            )}
          >
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent className="bg-card/95 backdrop-blur-md border-border/50">
            <SelectItem
              value="all"
              className={cn(
                "cursor-pointer",
                currentStatusValue === "all"
                  ? `${STATUS_STYLES.all.itemBg} ${STATUS_STYLES.all.text} font-medium`
                  : `focus:${STATUS_STYLES.all.itemBg} focus:${STATUS_STYLES.all.text}`
              )}
            >
              {t("allStatuses")}
            </SelectItem>
            <SelectItem
              value="PENDING"
              className={cn(
                "cursor-pointer",
                currentStatusValue === "PENDING"
                  ? `${STATUS_STYLES.PENDING.itemBg} ${STATUS_STYLES.PENDING.text} font-medium`
                  : `focus:${STATUS_STYLES.PENDING.itemBg} focus:${STATUS_STYLES.PENDING.text}`
              )}
            >
              {tAppointments("statusPending")}
            </SelectItem>
            <SelectItem
              value="CONFIRMED"
              className={cn(
                "cursor-pointer",
                currentStatusValue === "CONFIRMED"
                  ? `${STATUS_STYLES.CONFIRMED.itemBg} ${STATUS_STYLES.CONFIRMED.text} font-medium`
                  : `focus:${STATUS_STYLES.CONFIRMED.itemBg} focus:${STATUS_STYLES.CONFIRMED.text}`
              )}
            >
              {tAppointments("statusConfirmed")}
            </SelectItem>
            <SelectItem
              value="COMPLETED"
              className={cn(
                "cursor-pointer",
                currentStatusValue === "COMPLETED"
                  ? `${STATUS_STYLES.COMPLETED.itemBg} ${STATUS_STYLES.COMPLETED.text} font-medium`
                  : `focus:${STATUS_STYLES.COMPLETED.itemBg} focus:${STATUS_STYLES.COMPLETED.text}`
              )}
            >
              {tAppointments("statusCompleted")}
            </SelectItem>
            <SelectItem
              value="CANCELLED"
              className={cn(
                "cursor-pointer",
                currentStatusValue === "CANCELLED"
                  ? `${STATUS_STYLES.CANCELLED.itemBg} ${STATUS_STYLES.CANCELLED.text} font-medium`
                  : `focus:${STATUS_STYLES.CANCELLED.itemBg} focus:${STATUS_STYLES.CANCELLED.text}`
              )}
            >
              {tAppointments("statusCancelled")}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Search input - only shown in table view */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tAppointments("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 w-[200px] lg:w-[280px] h-9 bg-white"
            />
          </div>
        )}
      </div>

      {/* Right side - Service chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {services.map((service) => {
          const isSelected = filters.services.includes(service.id);
          const count = serviceCounts.get(service.id) || 0;
          const color = service.color || "#3B82F6";

          return (
            <button
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                isSelected
                  ? "text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              style={
                isSelected
                  ? { backgroundColor: color }
                  : undefined
              }
            >
              {!isSelected && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span>{service.name}</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs",
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-background text-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Show "All" button if not all services are selected */}
        {!allServicesSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllServices}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("clearAll")}
          </Button>
        )}
      </div>
    </div>
  );
}
