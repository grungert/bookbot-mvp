"use client";

import { format, parseISO, isPast } from "date-fns";
import { Calendar, CalendarDays, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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

interface AppointmentsHeaderProps {
  appointments: Appointment[];
  viewMode: "calendar" | "list";
  onViewModeChange: (mode: "calendar" | "list") => void;
  companySlug: string;
  t: ReturnType<typeof useTranslations<"appointments">>;
}

export function AppointmentsHeader({
  appointments,
  viewMode,
  onViewModeChange,
  companySlug,
  t,
}: AppointmentsHeaderProps) {
  const upcomingAppointments = appointments.filter(
    (a) => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED"
  );

  const nextAppointment = upcomingAppointments
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
    [0];

  const getNextAppointmentText = () => {
    if (!nextAppointment) return null;
    const date = parseISO(nextAppointment.startTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateText: string;
    if (date.toDateString() === today.toDateString()) {
      dateText = t("today");
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateText = t("tomorrow");
    } else {
      dateText = format(date, "EEE, MMM d");
    }

    return `${dateText} ${t("at")} ${format(date, "h:mm a")}`;
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/c/${companySlug}`}>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{t("myAppointments")}</h1>
              <p className="text-muted-foreground text-sm hidden sm:block">
                {t("viewAndManage")}
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("calendar")}
              className={cn(
                "gap-2 h-8 px-3 rounded-md",
                viewMode === "calendar" && "bg-background shadow-sm"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">{t("viewCalendar")}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "gap-2 h-8 px-3 rounded-md",
                viewMode === "list" && "bg-background shadow-sm"
              )}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t("viewList")}</span>
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-3 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">
              {t("upcomingCount", { count: upcomingAppointments.length })}
            </span>
          </div>
          {nextAppointment && (
            <div className="text-muted-foreground hidden sm:block">
              {t("next")}: <span className="font-medium text-foreground">{getNextAppointmentText()}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
