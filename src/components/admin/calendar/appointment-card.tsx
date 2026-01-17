"use client";

import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

// Color palette based on service type or can be randomized
const cardColors = [
  { bg: "bg-primary/10 dark:bg-primary/20", border: "border-l-primary", text: "text-primary dark:text-primary-foreground" },
  { bg: "bg-green-100 dark:bg-green-900/40", border: "border-l-green-400", text: "text-green-900 dark:text-green-100" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-l-amber-400", text: "text-amber-900 dark:text-amber-100" },
  { bg: "bg-purple-100 dark:bg-purple-900/40", border: "border-l-purple-400", text: "text-purple-900 dark:text-purple-100" },
  { bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-l-rose-400", text: "text-rose-900 dark:text-rose-100" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/40", border: "border-l-cyan-400", text: "text-cyan-900 dark:text-cyan-100" },
];

// Status-based colors (used for status indicator, not main card)
const statusColors: Record<Appointment["status"], string> = {
  CONFIRMED: "bg-primary",
  PENDING: "bg-amber-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-gray-400",
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

// Get a consistent color based on service name
function getCardColor(serviceName: string) {
  const hash = serviceName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return cardColors[Math.abs(hash) % cardColors.length];
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${formattedHours}.${formattedMinutes} ${ampm}`;
}

export function AppointmentCard({
  appointment,
  onClick,
  style,
  className,
}: AppointmentCardProps) {
  const serviceColor = appointment.service.color || "#3B82F6";
  const colors = getCardColor(appointment.service.name);
  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const initials = getInitials(appointment.user.name, appointment.user.email);
  const displayName = appointment.user.name || appointment.user.email.split("@")[0];

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "absolute left-1 right-1 cursor-pointer rounded-lg border-l-4 p-2.5 transition-all hover:shadow-lg hover:z-10 overflow-hidden",
        className
      )}
      style={{
        ...style,
        backgroundColor: `${serviceColor}15`,
        borderLeftColor: serviceColor,
      }}
      onClick={() => onClick?.(appointment)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(appointment);
        }
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header with avatar and name */}
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-6 w-6 shrink-0 border-2 border-white shadow-sm">
            {appointment.user.image ? (
              <AvatarImage src={appointment.user.image} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-[10px] font-semibold bg-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm truncate text-foreground">
            {displayName}
          </span>
        </div>

        {/* Service name */}
        <p className="text-xs truncate opacity-80 mb-auto text-foreground">
          {appointment.service.name}
        </p>

        {/* Time range at bottom */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-medium text-foreground">
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>

          {/* Status indicator */}
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                statusColors[appointment.status]
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
