"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface Service {
  id: string;
  name: string;
}

export interface FilterState {
  services: string[];
  statuses: string[];
}

interface CalendarFiltersSidebarProps {
  services: Service[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const statusOptions = [
  { id: "PENDING", label: "statusPending", color: "bg-amber-400", lightColor: "bg-amber-100" },
  { id: "CONFIRMED", label: "statusConfirmed", color: "bg-blue-500", lightColor: "bg-blue-100" },
  { id: "COMPLETED", label: "statusCompleted", color: "bg-emerald-500", lightColor: "bg-emerald-100" },
  { id: "CANCELLED", label: "statusCancelled", color: "bg-gray-400", lightColor: "bg-gray-100" },
];

// Service colors that rotate
const serviceColors = [
  { dot: "bg-blue-500", light: "bg-blue-100" },
  { dot: "bg-emerald-500", light: "bg-emerald-100" },
  { dot: "bg-amber-500", light: "bg-amber-100" },
  { dot: "bg-purple-500", light: "bg-purple-100" },
  { dot: "bg-rose-500", light: "bg-rose-100" },
  { dot: "bg-cyan-500", light: "bg-cyan-100" },
];

export function CalendarFiltersSidebar({
  services,
  filters,
  onFiltersChange,
  className,
}: CalendarFiltersSidebarProps) {
  const t = useTranslations("calendar");
  const tAppointments = useTranslations("appointments");

  const toggleService = (serviceId: string) => {
    const newServices = filters.services.includes(serviceId)
      ? filters.services.filter((id) => id !== serviceId)
      : [...filters.services, serviceId];
    onFiltersChange({ ...filters, services: newServices });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Service/Treatment Filters */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t("typeTreatment")}
        </h3>
        <div className="space-y-2.5">
          {services.map((service, index) => {
            const isChecked = filters.services.includes(service.id);
            const colors = serviceColors[index % serviceColors.length];

            return (
              <label
                key={service.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  isChecked ? colors.light : "hover:bg-muted/50"
                )}
              >
                <Checkbox
                  id={`service-${service.id}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleService(service.id)}
                  className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className={cn("h-2.5 w-2.5 rounded-full", colors.dot)} />
                <span className="text-sm font-medium flex-1">{service.name}</span>
              </label>
            );
          })}
          {services.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {t("noServices")}
            </p>
          )}
        </div>
      </div>

      {/* Status Filters */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t("filterByStatus")}
        </h3>
        <div className="space-y-2.5">
          {statusOptions.map((status) => {
            const isChecked = filters.statuses.includes(status.id);

            return (
              <label
                key={status.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  isChecked ? status.lightColor : "hover:bg-muted/50"
                )}
              >
                <Checkbox
                  id={`status-${status.id}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleStatus(status.id)}
                  className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className={cn("h-2.5 w-2.5 rounded-full", status.color)} />
                <span className="text-sm font-medium flex-1">
                  {tAppointments(status.label)}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
