"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO, isToday, isFuture } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Appointment } from "./appointment-card";

interface PatientQueueProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  className?: string;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export function PatientQueue({
  appointments,
  onAppointmentClick,
  className,
}: PatientQueueProps) {
  const t = useTranslations("calendar");

  // Filter and sort upcoming appointments (today and future, not cancelled)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const aptDate = parseISO(apt.startTime);
        return (
          apt.status !== "CANCELLED" &&
          apt.status !== "COMPLETED" &&
          (isToday(aptDate) || isFuture(aptDate))
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      .slice(0, 10);
  }, [appointments]);

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("patientQueue")}
        </h3>
        {upcomingAppointments.length > 0 && (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 px-1.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary"
          >
            {upcomingAppointments.length}
          </Badge>
        )}
      </div>

      <ScrollArea className="h-[320px] -mx-1">
        {upcomingAppointments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center px-1">
            {t("noUpcoming")}
          </p>
        ) : (
          <div className="space-y-1 px-1">
            {upcomingAppointments.map((apt) => {
              const startTime = parseISO(apt.startTime);
              const displayName = apt.user.name || apt.user.email.split("@")[0];

              return (
                <button
                  key={apt.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-left group"
                  onClick={() => onAppointmentClick?.(apt)}
                >
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm">
                    {apt.user.image ? (
                      <AvatarImage src={apt.user.image} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/30 text-primary">
                      {getInitials(apt.user.name, apt.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {format(startTime, "d MMM yyyy")} • {apt.service.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
