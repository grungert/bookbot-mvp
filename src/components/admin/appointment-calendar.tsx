"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  service: {
    name: string;
    duration: number;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDaySelect?: (date: Date, appointments: Appointment[]) => void;
}

const statusColors: Record<Appointment["status"], string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-primary",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-green-500",
};

const statusIcons: Record<
  Appointment["status"],
  React.ComponentType<{ className?: string }>
> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  CANCELLED: XCircle,
  COMPLETED: CheckCircle,
};

export function AppointmentCalendar({
  appointments,
  onDaySelect,
}: AppointmentCalendarProps) {
  const t = useTranslations("appointments");
  const tCalendar = useTranslations("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [view, setView] = useState<"week" | "month">("week");

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(apt);
    });
    return grouped;
  }, [appointments]);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return appointmentsByDate.get(dateKey) || [];
  };

  // Get status counts for a date
  const getStatusCounts = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date);
    const counts: Record<Appointment["status"], number> = {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    };
    dayAppointments.forEach((apt) => {
      counts[apt.status]++;
    });
    return counts;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dayAppointments = getAppointmentsForDate(date);
    onDaySelect?.(date, dayAppointments);
  };

  // Week navigation
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  // Month navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Selected day's appointments
  const selectedDayAppointments = selectedDate
    ? getAppointmentsForDate(selectedDate)
    : [];

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
        <TabsList>
          <TabsTrigger value="week">{tCalendar("week")}</TabsTrigger>
          <TabsTrigger value="month">{tCalendar("month")}</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h3>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const statusCounts = getStatusCounts(day);

              return (
                <Card
                  key={day.toISOString()}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    isSelected && "ring-2 ring-primary",
                    isToday && "border-primary"
                  )}
                  onClick={() => handleDateSelect(day)}
                >
                  <CardContent className="p-2 min-h-[100px]">
                    <div className="text-center mb-2">
                      <div className="text-xs text-muted-foreground">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-medium",
                          isToday &&
                            "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>

                    {dayAppointments.length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(statusCounts)
                          .filter(([, count]) => count > 0)
                          .map(([status, count]) => (
                            <div
                              key={status}
                              className="flex items-center justify-center gap-1"
                            >
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  statusColors[status as Appointment["status"]]
                                )}
                              />
                              <span className="text-xs">{count}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="month" className="mt-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium">{format(currentDate, "MMMM yyyy")}</h3>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && handleDateSelect(date)}
            month={currentDate}
            onMonthChange={setCurrentDate}
            className="rounded-md border"
            modifiers={{
              hasAppointments: (date) => getAppointmentsForDate(date).length > 0,
            }}
            modifiersClassNames={{
              hasAppointments: "bg-primary/10 font-bold",
            }}
            components={{
              DayButton: ({ day, modifiers, ...props }) => {
                const dayAppointments = getAppointmentsForDate(day.date);
                const hasAppointments = dayAppointments.length > 0;

                return (
                  <button
                    {...props}
                    className={cn(
                      props.className,
                      "relative w-full h-full p-1"
                    )}
                  >
                    <span>{format(day.date, "d")}</span>
                    {hasAppointments && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayAppointments.length <= 3 ? (
                          dayAppointments.map((apt, i) => (
                            <span
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                statusColors[apt.status]
                              )}
                            />
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </span>
                    )}
                  </button>
                );
              },
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Selected day appointments */}
      {selectedDate && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h4>
            {selectedDayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {tCalendar("noAppointments")}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayAppointments
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime()
                  )
                  .map((apt) => {
                    const StatusIcon = statusIcons[apt.status];
                    return (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-1 h-10 rounded-full",
                              statusColors[apt.status]
                            )}
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {apt.service.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(apt.startTime), "HH:mm")} -{" "}
                              {format(parseISO(apt.endTime), "HH:mm")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {apt.user.name || apt.user.email}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            apt.status === "CONFIRMED"
                              ? "default"
                              : apt.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="flex items-center gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {t(`status${apt.status.charAt(0)}${apt.status.slice(1).toLowerCase()}`)}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
