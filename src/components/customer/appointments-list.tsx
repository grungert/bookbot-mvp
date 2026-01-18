"use client";

import { useMemo, useRef } from "react";
import { format, parseISO, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, ChevronRight, CalendarPlus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Helper function to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
}

interface ServiceWithCount {
  id: string;
  name: string;
  color: string | null;
  count: number;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  companySlug: string;
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

export function AppointmentsList({
  appointments,
  onSelectAppointment,
  filterStatus,
  onFilterStatusChange,
  companySlug,
  servicesWithCounts,
  selectedServiceIds,
  onServiceToggle,
  dateRange,
  onDateRangeChange,
  t,
}: AppointmentsListProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter appointments based on status filter
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    if (filterStatus === "upcoming") {
      filtered = filtered.filter(
        (a) => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED"
      );
    } else if (filterStatus === "past") {
      filtered = filtered.filter(
        (a) => isPast(parseISO(a.startTime)) || a.status === "CANCELLED"
      );
    } else if (filterStatus !== "all") {
      filtered = filtered.filter(
        (a) => a.status.toLowerCase() === filterStatus
      );
    }

    // Sort by date (upcoming first, then past)
    return filtered.sort((a, b) => {
      const aTime = parseISO(a.startTime).getTime();
      const bTime = parseISO(b.startTime).getTime();
      const now = Date.now();

      // If both are in the future or both in the past, sort chronologically
      const aIsPast = aTime < now;
      const bIsPast = bTime < now;

      if (aIsPast === bIsPast) {
        return aTime - bTime;
      }

      // Future appointments come first
      return aIsPast ? 1 : -1;
    });
  }, [appointments, filterStatus]);

  // Group appointments by date
  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, Appointment[]>();

    filteredAppointments.forEach((apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, apt]);
    });

    return Array.from(groups.entries()).map(([date, apts]) => ({
      date: parseISO(date + "T00:00:00"),
      appointments: apts,
    }));
  }, [filteredAppointments]);

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

      {/* Appointment list */}
      {groupedAppointments.length === 0 ? (
        <Card className="rounded-xl border bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t("noAppointments")}</p>
            <Link href={`/c/${companySlug}/book`}>
              <Button className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                {t("bookNow")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {groupedAppointments.map(({ date, appointments: dayAppointments }) => (
              <motion.div
                key={date.toISOString()}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                layout={!prefersReducedMotion}
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(date, "EEEE, MMMM d, yyyy")}
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {dayAppointments.map((appointment, cardIndex) => (
                      <motion.div
                        key={appointment.id}
                        variants={prefersReducedMotion ? undefined : itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                          duration: 0.2,
                          delay: cardIndex * 0.05,
                        }}
                        layout={!prefersReducedMotion}
                      >
                        <AppointmentListCard
                          appointment={appointment}
                          onClick={() => onSelectAppointment(appointment)}
                          t={t}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AppointmentListCard({
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
        "shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20",
        isAppointmentPast && "opacity-60"
      )}
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${hexToRgba(serviceColor, 0.05)}, transparent)`
      }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Service color bar with glow on hover */}
            <div
              className="w-1.5 h-16 rounded-full shrink-0 service-color-bar"
              style={{
                backgroundColor: serviceColor,
                "--glow-color": hexToRgba(serviceColor, 0.6)
              } as React.CSSProperties}
            />

            {/* Time display with icon container styling */}
            <div
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] rounded-lg p-2",
                "transition-all duration-300 group-hover:scale-105"
              )}
              style={{ backgroundColor: hexToRgba(serviceColor, 0.1) }}
            >
              <span className="text-lg font-bold">
                {format(startTime, "h:mm")}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(startTime, "a")}
              </span>
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold transition-colors duration-200 group-hover:text-primary">
                  {appointment.service.name}
                </h4>
                <Badge
                  className={cn("text-xs", statusColors[appointment.status])}
                  variant="outline"
                >
                  {t(appointment.status.toLowerCase() as "pending" | "confirmed" | "cancelled" | "completed")}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{appointment.service.duration} min</span>
                </div>
                {appointment.service.price > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {appointment.service.price.toLocaleString()}{" "}
                      {appointment.service.currency}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}
