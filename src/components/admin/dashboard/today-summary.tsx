"use client";

import { Calendar, Clock, DollarSign, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TodaySummaryProps {
  appointmentsToday: number;
  confirmedToday: number;
  pendingToday: number;
  completedToday: number;
  revenueToday: number;
  nextAppointment?: {
    time: string;
    serviceName: string;
    customerName: string;
  };
  currency: string;
  translations: {
    todaySummary: string;
    appointmentsToday: string;
    confirmed: string;
    pending: string;
    completed: string;
    revenueToday: string;
    nextAppointment: string;
    noAppointmentsToday: string;
    at: string;
  };
  prefersReducedMotion?: boolean;
}

export function TodaySummary({
  appointmentsToday,
  confirmedToday,
  pendingToday,
  completedToday,
  revenueToday,
  nextAppointment,
  currency,
  translations,
  prefersReducedMotion = false,
}: TodaySummaryProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10",
        !prefersReducedMotion && "animate-fade-up stagger-1"
      )}
      style={!prefersReducedMotion ? { opacity: 0 } : undefined}
    >
      {/* Today Label */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold">{translations.todaySummary}</span>
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-border" />

      {/* Appointments Today */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{translations.appointmentsToday}:</span>
          <span className="font-semibold">{appointmentsToday}</span>
        </div>

        {appointmentsToday > 0 && (
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-3 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {confirmedToday}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-green-500 text-white text-xs border-0">
                  <p>{translations.confirmed}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {pendingToday}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-amber-500 text-white text-xs border-0">
                  <p>{translations.pending}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {completedToday}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-500 text-white text-xs border-0">
                  <p>{translations.completed}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Divider */}
      <div className="hidden md:block h-6 w-px bg-border" />

      {/* Revenue Today */}
      <div className="flex items-center gap-1.5 text-sm">
        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-muted-foreground">{translations.revenueToday}:</span>
        <span className="font-semibold">{currency} {revenueToday.toLocaleString()}</span>
      </div>

      {/* Divider */}
      <div className="hidden lg:block h-6 w-px bg-border" />

      {/* Next Appointment */}
      {nextAppointment ? (
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">{translations.nextAppointment}:</span>
          <span className="font-medium">
            {nextAppointment.time} - {nextAppointment.serviceName}
          </span>
        </div>
      ) : appointmentsToday === 0 ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span>{translations.noAppointmentsToday}</span>
        </div>
      ) : null}
    </div>
  );
}
