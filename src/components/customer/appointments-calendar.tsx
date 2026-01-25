"use client";

import { useMemo, useCallback, useRef } from "react";
import { format, parseISO, isSameDay, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, ChevronRight, CalendarDays, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Helper function to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    currency: string;
    color: string | null;
  };
  company?: Company;
}

interface ServiceWithCount {
  id: string;
  name: string;
  color: string | null;
  count: number;
}

interface AppointmentsCalendarProps {
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  closedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  servicesWithCounts: ServiceWithCount[];
  selectedServiceIds: string[] | null;
  onServiceToggle: (serviceId: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  t: ReturnType<typeof useTranslations<"appointments">>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
};

export function AppointmentsCalendar({
  appointments,
  selectedDate,
  onSelectDate,
  onSelectAppointment,
  closedDays,
  filterStatus,
  onFilterStatusChange,
  servicesWithCounts,
  selectedServiceIds,
  onServiceToggle,
  dateRange,
  onDateRangeChange,
  t,
}: AppointmentsCalendarProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Group appointments by date for calendar indicators
  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, apt]);
    });
    return grouped;
  }, [appointments]);

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    return appointments
      .filter((apt) => isSameDay(parseISO(apt.startTime), selectedDate))
      .sort(
        (a, b) =>
          parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
      );
  }, [appointments, selectedDate]);

  // Get colored dots for a date based on service colors
  const getDayIndicators = useCallback(
    (date: Date): string[] => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayAppointments = appointmentsByDate.get(dateKey) || [];
      // Get unique colors, filter out cancelled
      const colors = dayAppointments
        .filter((apt) => apt.status !== "CANCELLED")
        .map((apt) => apt.service.color || "#3B82F6")
        .filter((color, index, self) => self.indexOf(color) === index);
      return colors.slice(0, 3); // Max 3 dots
    },
    [appointmentsByDate]
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectDate(date);
    }
  };

  // Disable closed days (non-working days)
  const isClosedDay = useCallback(
    (date: Date) => {
      return closedDays.includes(date.getDay());
    },
    [closedDays]
  );

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className={cn(
              "w-[180px] bg-card/80 backdrop-blur-sm transition-colors",
              filterStatus === "confirmed" && "border-green-500/50 hover:border-green-500/70 text-green-700",
              filterStatus === "pending" && "border-yellow-500/50 hover:border-yellow-500/70 text-yellow-700",
              filterStatus === "cancelled" && "border-red-500/50 hover:border-red-500/70 text-red-700",
              (filterStatus === "all" || filterStatus === "upcoming") && "border-primary/30 hover:border-primary/50 text-primary",
              filterStatus === "past" && "border-border/50 hover:border-border text-muted-foreground"
            )}>
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-md border-border/50">
              <SelectItem value="all" className={cn("cursor-pointer", filterStatus === "all" ? "bg-primary/10 text-primary font-medium" : "focus:bg-primary/10 focus:text-primary")}>{t("all")}</SelectItem>
              <SelectItem value="upcoming" className={cn("cursor-pointer", filterStatus === "upcoming" ? "bg-primary/10 text-primary font-medium" : "focus:bg-primary/10 focus:text-primary")}>{t("upcoming")}</SelectItem>
              <SelectItem value="past" className={cn("cursor-pointer", filterStatus === "past" ? "bg-muted font-medium" : "focus:bg-muted")}>{t("past")}</SelectItem>
              <SelectItem value="confirmed" className={cn("cursor-pointer", filterStatus === "confirmed" ? "bg-green-500/10 text-green-700 font-medium" : "focus:bg-green-500/10 focus:text-green-700")}>{t("confirmed")}</SelectItem>
              <SelectItem value="pending" className={cn("cursor-pointer", filterStatus === "pending" ? "bg-yellow-500/10 text-yellow-700 font-medium" : "focus:bg-yellow-500/10 focus:text-yellow-700")}>{t("pending")}</SelectItem>
              <SelectItem value="cancelled" className={cn("cursor-pointer", filterStatus === "cancelled" ? "bg-red-500/10 text-red-700 font-medium" : "focus:bg-red-500/10 focus:text-red-700")}>{t("cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal gap-2",
                  "bg-card/80 backdrop-blur-sm",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>{t("selectDateRange")}</span>
                )}
                {dateRange && (
                  <X
                    className="h-3 w-3 ml-1 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateRangeChange(undefined);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" container={containerRef.current}>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                defaultMonth={dateRange?.from}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Service filter badges */}
        {servicesWithCounts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {servicesWithCounts.map(service => {
              const isSelected = selectedServiceIds === null ||
                selectedServiceIds.length === servicesWithCounts.length ||
                selectedServiceIds.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => onServiceToggle(service.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer",
                    "transition-all duration-300 press-feedback",
                    "shadow-sm hover:shadow-md hover:-translate-y-0.5",
                    isSelected
                      ? "text-white"
                      : "bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/20"
                  )}
                  style={isSelected ? {
                    background: `linear-gradient(135deg, ${service.color || "#3B82F6"}, ${service.color || "#3B82F6"}dd)`
                  } : {}}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? "white" : (service.color || "#3B82F6") }}
                  />
                  <span className="font-medium">{service.name}</span>
                  <span className={cn(
                    "ml-0.5 px-1.5 py-0.5 text-xs rounded-full",
                    isSelected ? "bg-white/20" : "bg-primary/10 text-primary"
                  )}>
                    {service.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Month Calendar */}
      <Card
        className={cn(
          "overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm",
          "transition-all duration-300 hover:shadow-lg hover:border-primary/10",
          !prefersReducedMotion && "animate-fade-in-scale"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <CardContent className="p-0">
          <div className="flex items-center justify-center p-6 pb-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              getDayIndicators={getDayIndicators}
              disabled={isClosedDay}
              weekStartsOn={1}
              className="w-full max-w-[400px] [--cell-size:theme(spacing.12)]"
              classNames={{
                months: "w-full flex flex-col items-center",
                month: "w-full space-y-4",
                caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-base font-semibold",
                nav: "flex items-center gap-1",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-12 font-medium text-sm flex-1 text-center",
                row: "flex w-full mt-2",
                cell: "flex-1 text-center relative p-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Appointments */}
      <div className="space-y-4">
        <div
          className={cn(
            "flex items-center gap-2 text-lg font-semibold",
            !prefersReducedMotion && "animate-fade-up stagger-1"
          )}
          style={!prefersReducedMotion ? { opacity: 0 } : undefined}
        >
          <CalendarDays className="h-5 w-5 text-primary" />
          <span>{format(selectedDate, "EEEE, MMMM d")}</span>
        </div>

        {selectedDateAppointments.length === 0 ? (
          <Card
            className={cn(
              "border-dashed rounded-xl bg-card/80 backdrop-blur-sm",
              !prefersReducedMotion && "animate-fade-in-scale stagger-2"
            )}
            style={!prefersReducedMotion ? { opacity: 0 } : undefined}
          >
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {t("noAppointmentsOnDate")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {selectedDateAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  variants={prefersReducedMotion ? undefined : itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                  layout={!prefersReducedMotion}
                >
                  <AppointmentDayCard
                    appointment={appointment}
                    onClick={() => onSelectAppointment(appointment)}
                    t={t}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function AppointmentDayCard({
  appointment,
  onClick,
  t,
}: {
  appointment: Appointment;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<"appointments">>;
}) {
  const startTime = parseISO(appointment.startTime);
  const isAppointmentPast =
    isPast(startTime) || appointment.status === "CANCELLED";
  const serviceColor = appointment.service.color || "#3B82F6";

  return (
    <Card
      className={cn(
        "cursor-pointer group overflow-hidden appointment-card",
        "rounded-xl border bg-gradient-to-br to-transparent",
        "shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20",
        isAppointmentPast && "opacity-60"
      )}
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${hexToRgba(serviceColor, 0.05)}, transparent)`
      }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Service color bar with glow on hover */}
            <div
              className="w-1.5 h-14 rounded-full shrink-0 service-color-bar"
              style={{
                backgroundColor: serviceColor,
                "--glow-color": hexToRgba(serviceColor, 0.6)
              } as React.CSSProperties}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h4 className="font-semibold truncate transition-colors duration-200 group-hover:text-primary">
                  {appointment.service.name}
                </h4>
                <Badge
                  className={cn("text-xs shrink-0", statusColors[appointment.status])}
                  variant="outline"
                >
                  {t(appointment.status.toLowerCase() as "pending" | "confirmed" | "cancelled" | "completed")}
                </Badge>
              </div>
              {appointment.company && (
                <p className="text-xs text-muted-foreground mb-1 truncate">
                  {appointment.company.name}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md transition-all duration-300"
                  style={{ backgroundColor: hexToRgba(serviceColor, 0.1) }}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{format(startTime, "h:mm a")}</span>
                </div>
                <span className="text-muted-foreground/50">•</span>
                <span>{appointment.service.duration} min</span>
                {appointment.service.price > 0 && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span>
                      {appointment.service.price.toLocaleString()}{" "}
                      {appointment.service.currency}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-1 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
