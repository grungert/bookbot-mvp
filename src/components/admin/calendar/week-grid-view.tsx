"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentCard, Appointment } from "./appointment-card";

interface WeekGridViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT = 80; // pixels per hour

export function WeekGridView({
  currentDate,
  appointments,
  onAppointmentClick,
  startHour = 9,
  endHour = 18,
}: WeekGridViewProps) {
  // Get week days (Sunday start to match the design)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    weekDays.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      grouped.set(dateKey, []);
    });
    appointments.forEach((apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      if (grouped.has(dateKey)) {
        grouped.get(dateKey)!.push(apt);
      }
    });
    return grouped;
  }, [appointments, weekDays]);

  // Calculate card position and height
  const getCardStyle = (appointment: Appointment): React.CSSProperties => {
    const start = parseISO(appointment.startTime);
    const hours = start.getHours() + start.getMinutes() / 60;
    const top = (hours - startHour) * HOUR_HEIGHT;
    const height = (appointment.service.duration / 60) * HOUR_HEIGHT;
    return {
      top: `${top}px`,
      height: `${Math.max(height, 60)}px`, // Minimum height of 60px
    };
  };

  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b bg-muted/30">
        <div className="p-3 text-xs text-muted-foreground font-medium">
          GMT+1
        </div>
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className="p-3 text-center border-l"
            >
              <div className={cn(
                "text-xs font-medium uppercase tracking-wide",
                today ? "text-primary" : "text-muted-foreground"
              )}>
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold",
                  today
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div
        className="relative grid grid-cols-[70px_repeat(7,1fr)] overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        {/* Time column */}
        <div className="sticky left-0 z-10 bg-card">
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="relative border-b border-dashed"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              <span className="absolute -top-2.5 right-3 text-xs text-muted-foreground font-medium">
                {hour.toString().padStart(2, "0")}.00{hour < 12 ? "AM" : "PM"}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay.get(dateKey) || [];
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-l",
                today && "bg-primary/5 dark:bg-primary/10"
              )}
            >
              {/* Hour grid lines */}
              {timeSlots.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-dashed"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}

              {/* Appointments */}
              <div className="absolute inset-0 p-1">
                {dayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    style={getCardStyle(appointment)}
                    onClick={onAppointmentClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
