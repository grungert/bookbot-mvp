"use client";

import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Mail, Phone, Calendar, User } from "lucide-react";

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  service: {
    id?: string;
    name: string;
    duration: number;
    color?: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image?: string | null;
  };
}

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  style?: React.CSSProperties;
  className?: string;
}

// Status colors for the indicator dot
const statusColors: Record<Appointment["status"], string> = {
  CONFIRMED: "bg-emerald-500",
  PENDING: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-gray-400",
};

const statusLabels: Record<Appointment["status"], string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusBadgeVariants: Record<Appointment["status"], "default" | "secondary" | "destructive" | "outline"> = {
  CONFIRMED: "default",
  PENDING: "secondary",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

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

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function AppointmentCard({
  appointment,
  onClick,
  style,
  className,
}: AppointmentCardProps) {
  const serviceColor = appointment.service.color || "#3B82F6";
  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const initials = getInitials(appointment.user.name, appointment.user.email);
  const displayName = appointment.user.name || appointment.user.email.split("@")[0];

  const cardContent = (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "absolute left-0.5 right-0.5 cursor-pointer rounded-lg p-2 transition-all hover:shadow-md hover:z-10 overflow-hidden group",
        className
      )}
      style={{
        ...style,
        backgroundColor: `${serviceColor}20`,
      }}
      onClick={() => onClick?.(appointment)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(appointment);
        }
      }}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header with avatar and name */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <Avatar className="h-5 w-5 shrink-0 border border-white/50 shadow-sm">
            {appointment.user.image ? (
              <AvatarImage src={appointment.user.image} alt={displayName} />
            ) : null}
            <AvatarFallback
              className="text-[9px] font-semibold text-white"
              style={{ backgroundColor: serviceColor }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-xs truncate text-foreground leading-tight">
            {displayName}
          </span>
        </div>

        {/* Time range */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] text-muted-foreground leading-tight">
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>

          {/* Status indicator dot */}
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              statusColors[appointment.status]
            )}
          />
        </div>
      </div>
    </div>
  );

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-72 p-0"
        sideOffset={8}
      >
        {/* Header with service color */}
        <div
          className="px-4 py-3 rounded-t-md"
          style={{ backgroundColor: `${serviceColor}20` }}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{appointment.service.name}</h4>
            <Badge variant={statusBadgeVariants[appointment.status]} className="text-xs">
              {statusLabels[appointment.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {appointment.service.duration} minutes
          </p>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          {/* Customer info */}
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              {appointment.user.image ? (
                <AvatarImage src={appointment.user.image} alt={displayName} />
              ) : null}
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: serviceColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{appointment.user.email}</span>
              </div>
              {appointment.user.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{appointment.user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startTime, "EEEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground text-center rounded-b-md">
          Click to view full details
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
