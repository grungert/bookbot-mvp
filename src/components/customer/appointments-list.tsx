"use client";

import { useMemo } from "react";
import { format, parseISO, isPast } from "date-fns";
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
import { Calendar, Clock, ChevronRight, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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

interface AppointmentsListProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  companySlug: string;
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
  t,
}: AppointmentsListProps) {
  const prefersReducedMotion = useReducedMotion();

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
            <SelectItem value="past">{t("past")}</SelectItem>
            <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointment list */}
      {groupedAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          {groupedAppointments.map(({ date, appointments: dayAppointments }, groupIndex) => (
            <div
              key={date.toISOString()}
              className={cn(
                !prefersReducedMotion && "animate-fade-up",
                !prefersReducedMotion && groupIndex > 0 && `stagger-${Math.min(groupIndex, 5)}`
              )}
              style={!prefersReducedMotion ? { opacity: 0 } : undefined}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(date, "EEEE, MMMM d, yyyy")}
              </h3>
              <div
                key={dayAppointments.map(a => a.id).join(',')}
                className="filter-grid"
              >
                {dayAppointments.map((appointment, cardIndex) => (
                  <AppointmentListCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => onSelectAppointment(appointment)}
                    t={t}
                    animationDelay={!prefersReducedMotion ? cardIndex * 50 : 0}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentListCard({
  appointment,
  onClick,
  t,
  animationDelay = 0,
  prefersReducedMotion = false,
}: {
  appointment: Appointment;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<"appointments">>;
  animationDelay?: number;
  prefersReducedMotion?: boolean;
}) {
  const startTime = parseISO(appointment.startTime);
  const isAppointmentPast =
    isPast(startTime) || appointment.status === "CANCELLED";
  const serviceColor = appointment.service.color || "#3B82F6";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group hover-lift press-feedback",
        isAppointmentPast && "opacity-60",
        !prefersReducedMotion && "filter-item"
      )}
      onClick={onClick}
      style={
        !prefersReducedMotion
          ? { animationDelay: `${animationDelay}ms` }
          : undefined
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Service color bar */}
            <div
              className="w-1 h-16 rounded-full shrink-0"
              style={{ backgroundColor: serviceColor }}
            />

            {/* Time column */}
            <div className="flex flex-col items-center justify-center min-w-[60px]">
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
                <h4 className="font-semibold">{appointment.service.name}</h4>
                <Badge
                  className={cn("text-xs", statusColors[appointment.status])}
                  variant="outline"
                >
                  {t(appointment.status.toLowerCase())}
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

          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
