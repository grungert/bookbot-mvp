"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isToday,
  getDay,
} from "date-fns";
import { srLatn, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AppointmentCard, Appointment } from "./appointment-card";

interface WorkingHoursEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

interface WeekGridViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, time: string) => void;
  startHour?: number;
  endHour?: number;
  timezone?: string;
  workingHours?: WorkingHoursEntry[];
  selectedAppointmentId?: string | null;
}

const HOUR_HEIGHT = 80; // pixels per hour

// Type for overlap group calculation
interface OverlapGroup {
  appointments: Appointment[];
  startTime: number;
  endTime: number;
}

/**
 * Calculate overlap groups for appointments on a given day.
 * Returns a map of appointment ID to { total: number of overlapping, index: position }
 */
function calculateOverlapGroups(
  appointments: Appointment[]
): Map<string, { total: number; index: number }> {
  const result = new Map<string, { total: number; index: number }>();

  if (appointments.length === 0) return result;

  // Sort by start time
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Find overlapping groups
  const groups: OverlapGroup[] = [];

  for (const apt of sorted) {
    const aptStart = new Date(apt.startTime).getTime();
    const aptEnd = new Date(apt.endTime).getTime();

    // Find or create a group this appointment belongs to
    let foundGroup = false;
    for (const group of groups) {
      // Check if this appointment overlaps with the group
      if (aptStart < group.endTime && aptEnd > group.startTime) {
        group.appointments.push(apt);
        group.endTime = Math.max(group.endTime, aptEnd);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push({
        appointments: [apt],
        startTime: aptStart,
        endTime: aptEnd,
      });
    }
  }

  // Assign positions within each group
  for (const group of groups) {
    const total = group.appointments.length;
    group.appointments.forEach((apt, index) => {
      result.set(apt.id, { total, index });
    });
  }

  return result;
}

export function WeekGridView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  startHour: defaultStartHour = 9,
  endHour: defaultEndHour = 18,
  timezone = "Europe/Belgrade",
  workingHours = [],
  selectedAppointmentId,
}: WeekGridViewProps) {
  // Locale for date formatting
  const locale = useLocale();
  const dateLocale = locale === "sr" ? srLatn : enUS;
  const prefersReducedMotion = useReducedMotion();

  // Ref for the grid container to enable scrolling
  const gridRef = useRef<HTMLDivElement>(null);

  // Current time state for the "now" indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Get week days (Monday start)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Map of day of week to working hours info
  const workingHoursMap = useMemo(() => {
    const map = new Map<number, WorkingHoursEntry>();
    workingHours.forEach((wh) => {
      map.set(wh.dayOfWeek, wh);
    });
    return map;
  }, [workingHours]);

  // Calculate start/end hours based on working hours (with 1 hour padding)
  const { startHour, endHour } = useMemo(() => {
    const openDays = workingHours.filter((wh) => wh.isOpen);

    if (openDays.length === 0) {
      return { startHour: defaultStartHour, endHour: defaultEndHour };
    }

    // Parse times to get hours
    let earliestStart = 24;
    let latestEnd = 0;

    openDays.forEach((wh) => {
      const startParts = wh.startTime.split(":");
      const endParts = wh.endTime.split(":");
      const startH = parseInt(startParts[0], 10);
      const endH = parseInt(endParts[0], 10);

      if (startH < earliestStart) earliestStart = startH;
      if (endH > latestEnd) latestEnd = endH;
    });

    // Add 1 hour padding before and after, clamped to 0-23
    const paddedStart = Math.max(0, earliestStart - 1);
    const paddedEnd = Math.min(23, latestEnd + 1);

    return { startHour: paddedStart, endHour: paddedEnd };
  }, [workingHours, defaultStartHour, defaultEndHour]);

  // Find selected appointment for scrolling
  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null;
    return appointments.find(apt => apt.id === selectedAppointmentId) || null;
  }, [selectedAppointmentId, appointments]);

  // Scroll to selected appointment when it changes
  useEffect(() => {
    if (selectedAppointment && gridRef.current) {
      // Calculate scroll position based on appointment time
      const appointmentStart = parseISO(selectedAppointment.startTime);
      const appointmentHour = appointmentStart.getHours() + appointmentStart.getMinutes() / 60;

      // Calculate the pixel position of the appointment
      const appointmentTop = (appointmentHour - startHour) * HOUR_HEIGHT;

      // Get the grid's visible height
      const gridHeight = gridRef.current.clientHeight;

      // Scroll to center the appointment in the viewport
      const scrollTarget = Math.max(0, appointmentTop - gridHeight / 2 + HOUR_HEIGHT / 2);

      // Small delay to ensure the DOM has updated
      const timeoutId = setTimeout(() => {
        gridRef.current?.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedAppointment, startHour]);

  // Check if a day is closed
  const isDayClosed = (day: Date): boolean => {
    const dayOfWeek = getDay(day); // 0 = Sunday, 6 = Saturday
    const wh = workingHoursMap.get(dayOfWeek);
    return wh ? !wh.isOpen : false;
  };

  // Get working hours for a day
  const getDayWorkingHours = (day: Date): { start: string; end: string } | null => {
    const dayOfWeek = getDay(day);
    const wh = workingHoursMap.get(dayOfWeek);
    if (wh && wh.isOpen) {
      return { start: wh.startTime, end: wh.endTime };
    }
    return null;
  };

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // Group appointments by day with overlap information
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

  // Calculate overlap groups for each day
  const overlapByDay = useMemo(() => {
    const result = new Map<string, Map<string, { total: number; index: number }>>();
    appointmentsByDay.forEach((dayAppts, dateKey) => {
      result.set(dateKey, calculateOverlapGroups(dayAppts));
    });
    return result;
  }, [appointmentsByDay]);

  // Calculate "now" indicator position
  const nowIndicatorPosition = useMemo(() => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    // Only show if within visible hours
    if (hours < startHour || hours > endHour) {
      return null;
    }
    return (hours - startHour) * HOUR_HEIGHT;
  }, [currentTime, startHour, endHour]);

  // Calculate card position and height with overlap handling
  const getCardStyle = (
    appointment: Appointment,
    overlapInfo?: { total: number; index: number }
  ): React.CSSProperties => {
    const start = parseISO(appointment.startTime);
    const hours = start.getHours() + start.getMinutes() / 60;
    const top = (hours - startHour) * HOUR_HEIGHT;
    const height = (appointment.service.duration / 60) * HOUR_HEIGHT;

    // Handle overlapping appointments
    const total = overlapInfo?.total || 1;
    const index = overlapInfo?.index || 0;
    const width = total > 1 ? `${100 / total}%` : "100%";
    const left = total > 1 ? `${(index * 100) / total}%` : "0";

    return {
      top: `${top}px`,
      height: `${Math.max(height, 60)}px`, // Minimum height of 60px
      width,
      left,
    };
  };

  // Get timezone display name
  const timezoneDisplay = useMemo(() => {
    try {
      // Get short timezone name (e.g., "CET", "PST")
      const formatter = new Intl.DateTimeFormat("en", {
        timeZone: timezone,
        timeZoneName: "short",
      });
      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      return tzPart?.value || timezone;
    } catch {
      return timezone;
    }
  }, [timezone]);

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Scrollable container - both horizontal and vertical */}
      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }} ref={gridRef}>
        <div className="min-w-[800px]">
          {/* Sticky header row */}
          <div className="sticky top-0 z-30 flex border-b shadow-[0_2px_4px_rgba(0,0,0,0.05)]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.584)' }}>
            {/* Corner cell - sticky both left and top */}
            <div className="sticky left-0 z-40 w-[60px] shrink-0 h-[60px] p-2 text-xs text-muted-foreground font-medium border-r shadow-[2px_0_4px_rgba(0,0,0,0.05)] flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.584)' }}>
              {timezoneDisplay}
            </div>
            {/* Day headers */}
            <div className="flex-1 grid grid-cols-7 h-[60px]">
              {weekDays.map((day, dayIndex) => {
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className="p-2 text-center border-l flex flex-col items-center justify-center"
                  >
                    <div className={cn(
                      "text-xs font-medium uppercase tracking-wide",
                      today ? "text-primary" : "text-muted-foreground"
                    )}>
                      {format(day, "EEE", { locale: dateLocale })}
                    </div>
                    <div
                      className={cn(
                        "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
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
          </div>

          {/* Grid body */}
          <div className="flex">
            {/* Sticky time column */}
            <div className="sticky left-0 z-20 w-[60px] shrink-0 border-r shadow-[2px_0_4px_rgba(0,0,0,0.05)]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.584)' }}>
              {/* Time slots */}
              {timeSlots.map((hour, index) => (
                <div
                  key={hour}
                  className="relative border-b border-dashed"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className={cn(
                    "absolute right-2 text-xs text-muted-foreground font-medium",
                    index === 0 ? "top-1" : "-top-2.5"
                  )}>
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns grid */}
            <div className="flex-1 relative grid grid-cols-7">

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDay.get(dateKey) || [];
            const dayOverlaps = overlapByDay.get(dateKey);
            const today = isToday(day);
            const isClosed = isDayClosed(day);
            const dayHours = getDayWorkingHours(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l",
                  today && !isClosed && "bg-primary/5 dark:bg-primary/10",
                  isClosed && "bg-muted/50",
                  !prefersReducedMotion && "animate-fade-in-scale"
                )}
                style={!prefersReducedMotion ? { opacity: 0, animationDelay: `${dayIndex * 50 + 50}ms` } : undefined}
              >
                {/* Hour grid lines */}
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-dashed"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Clickable time slots overlay */}
                {!isClosed && onSlotClick && (
                  <div className="absolute inset-0 z-5">
                    {timeSlots.map((hour) => (
                      <div
                        key={`slot-${hour}`}
                        className="relative"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      >
                        {/* First 30-minute slot */}
                        <button
                          type="button"
                          className="absolute inset-x-0 top-0 h-1/2 hover:bg-primary/20 transition-colors cursor-pointer"
                          onClick={() => onSlotClick(day, `${hour.toString().padStart(2, "0")}:00`)}
                          aria-label={`Book at ${hour}:00`}
                        />
                        {/* Second 30-minute slot */}
                        <button
                          type="button"
                          className="absolute inset-x-0 bottom-0 h-1/2 hover:bg-primary/20 transition-colors cursor-pointer"
                          onClick={() => onSlotClick(day, `${hour.toString().padStart(2, "0")}:30`)}
                          aria-label={`Book at ${hour}:30`}
                        />
                        {/* Half-hour divider line */}
                        <div className="absolute inset-x-0 top-1/2 border-t border-dotted border-muted-foreground/20 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Closed day overlay */}
                {isClosed && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-muted/80 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">
                        Closed
                      </span>
                    </div>
                  </div>
                )}

                {/* Working hours indicator for open days */}
                {!isClosed && dayHours && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <span className="text-[10px] text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {dayHours.start} - {dayHours.end}
                    </span>
                  </div>
                )}

                {/* "Now" indicator - only on today's column */}
                {today && nowIndicatorPosition !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${nowIndicatorPosition}px` }}
                  >
                    {/* Red dot on the left */}
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                    {/* Red horizontal line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-red-500" />
                  </div>
                )}

                {/* Appointments - rendered on top with pointer-events-none container */}
                {!isClosed && (
                  <div className="absolute inset-0 p-1 z-10 pointer-events-none">
                    {dayAppointments.map((appointment) => {
                      const overlapInfo = dayOverlaps?.get(appointment.id);
                      const cardStyle = getCardStyle(appointment, overlapInfo);
                      return (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          style={cardStyle}
                          onClick={onAppointmentClick}
                          className="pointer-events-auto"
                          isSelected={selectedAppointmentId === appointment.id}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
