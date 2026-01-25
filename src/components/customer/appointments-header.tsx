"use client";

import { format, parseISO, isPast } from "date-fns";
import { Calendar, CalendarDays, List, ArrowLeft, Plus, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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

interface AppointmentsHeaderProps {
  appointments: Appointment[];
  viewMode: "calendar" | "list";
  onViewModeChange: (mode: "calendar" | "list") => void;
  scope: "all" | "company";
  onScopeChange: (scope: "all" | "company") => void;
  companySlug: string;
  t: ReturnType<typeof useTranslations<"appointments">>;
}

export function AppointmentsHeader({
  appointments,
  viewMode,
  onViewModeChange,
  scope,
  onScopeChange,
  companySlug,
  t,
}: AppointmentsHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

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
    <header
      className={cn(
        "border-b bg-card",
        !prefersReducedMotion && "animate-fade-up"
      )}
      style={!prefersReducedMotion ? { opacity: 0 } : undefined}
    >
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/c/${companySlug}`}>
              <Button variant="ghost" size="icon" className="shrink-0 press-feedback">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{t("allBookings")}</h1>
              <p className="text-muted-foreground text-sm hidden sm:block">
                {t("viewAndManage")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Book Button */}
            <Link href={`/c/${companySlug}/book`}>
              <Button
                size="sm"
                className={cn(
                  "gap-2 press-feedback",
                  !prefersReducedMotion && "animate-fade-up stagger-1"
                )}
                style={!prefersReducedMotion ? { opacity: 0 } : undefined}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("bookNew")}</span>
              </Button>
            </Link>

            {/* Scope Toggle (All / Company) */}
            <div
              className={cn(
                "flex items-center rounded-lg border bg-muted/50 p-1",
                !prefersReducedMotion && "animate-fade-up stagger-2"
              )}
              style={!prefersReducedMotion ? { opacity: 0 } : undefined}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onScopeChange("all")}
                className={cn(
                  "gap-2 h-8 px-3 rounded-md transition-all duration-200 press-feedback",
                  scope === "all" && "bg-background shadow-sm"
                )}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t("scopeAll")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onScopeChange("company")}
                className={cn(
                  "gap-2 h-8 px-3 rounded-md transition-all duration-200 press-feedback",
                  scope === "company" && "bg-background shadow-sm"
                )}
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("scopeCompany")}</span>
              </Button>
            </div>

            {/* View Toggle */}
            <div
              className={cn(
                "flex items-center rounded-lg border bg-muted/50 p-1",
                !prefersReducedMotion && "animate-fade-up stagger-2"
              )}
              style={!prefersReducedMotion ? { opacity: 0 } : undefined}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("calendar")}
                className={cn(
                  "gap-2 h-8 px-3 rounded-md transition-all duration-200 press-feedback",
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
                  "gap-2 h-8 px-3 rounded-md transition-all duration-200 press-feedback",
                  viewMode === "list" && "bg-background shadow-sm"
                )}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">{t("viewList")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className={cn(
            "mt-3 flex items-center gap-3 text-sm flex-wrap",
            !prefersReducedMotion && "animate-fade-up stagger-2"
          )}
          style={!prefersReducedMotion ? { opacity: 0 } : undefined}
        >
          {/* Upcoming count and next appointment */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">
                {t("upcomingCount", { count: upcomingAppointments.length })}
              </span>
            </div>
            {nextAppointment && (
              <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
                <span>{t("next")}:</span>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: nextAppointment.service.color || "#3B82F6" }}
                  />
                  <span className="font-medium text-foreground">
                    {nextAppointment.service.name}
                  </span>
                  <span className="text-muted-foreground/70">•</span>
                  <span className="font-medium text-foreground">
                    {getNextAppointmentText()}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
