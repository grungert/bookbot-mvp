"use client";

import { useMemo, useCallback } from "react";
import { format, parseISO, isSameDay, isPast } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

interface AppointmentsCalendarProps {
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  closedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
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
  t,
}: AppointmentsCalendarProps) {
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Month Calendar */}
      <Card className="overflow-hidden">
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
        <div className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span>{format(selectedDate, "EEEE, MMMM d")}</span>
        </div>

        {selectedDateAppointments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {t("noAppointmentsOnDate")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {selectedDateAppointments.map((appointment) => (
              <AppointmentDayCard
                key={appointment.id}
                appointment={appointment}
                onClick={() => onSelectAppointment(appointment)}
                t={t}
              />
            ))}
          </div>
        )}
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
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group",
        isAppointmentPast && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-1.5 h-14 rounded-full shrink-0"
              style={{ backgroundColor: serviceColor }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h4 className="font-semibold truncate">{appointment.service.name}</h4>
                <Badge
                  className={cn("text-xs shrink-0", statusColors[appointment.status])}
                  variant="outline"
                >
                  {t(appointment.status.toLowerCase() as "pending" | "confirmed" | "cancelled" | "completed")}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
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
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
