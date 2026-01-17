"use client";

import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment } from "./appointment-card";

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (appointmentId: string, status: Appointment["status"]) => void;
  onViewCustomer?: (userId: string) => void;
}

const statusStyles: Record<
  Appointment["status"],
  { variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  PENDING: { variant: "secondary", color: "bg-amber-500" },
  CONFIRMED: { variant: "default", color: "bg-blue-500" },
  CANCELLED: { variant: "destructive", color: "bg-gray-400" },
  COMPLETED: { variant: "outline", color: "bg-green-500" },
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
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${formattedHours}.${formattedMinutes} ${ampm}`;
}

export function AppointmentDetailModal({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
  onViewCustomer,
}: AppointmentDetailModalProps) {
  const t = useTranslations("calendar");
  const tAppointments = useTranslations("appointments");
  const tCommon = useTranslations("common");

  if (!appointment) return null;

  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const displayName = appointment.user.name || appointment.user.email.split("@")[0];
  const { color } = statusStyles[appointment.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-0 gap-0 rounded-xl overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Appointment Details</DialogTitle>
        </VisuallyHidden>
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {appointment.user.image ? (
                <AvatarImage src={appointment.user.image} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {getInitials(appointment.user.name, appointment.user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{displayName}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {appointment.user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {appointment.user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {appointment.user.email}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Service Info */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">{t("typeTreatment")}</span>
              <p className="font-medium">{appointment.service.name}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{tCommon("status")}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("h-2 w-2 rounded-full", color)} />
                <span className="font-medium text-sm">
                  {tAppointments(`status${appointment.status.charAt(0)}${appointment.status.slice(1).toLowerCase()}`)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-4 pb-4">
          <span className="text-xs text-muted-foreground">{t("appointmentTime")}</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div className="w-0.5 h-6 bg-primary/30" />
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("start")}</span>
                <span className="font-medium">{formatTime(startTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("end")}</span>
                <span className="font-medium">{formatTime(endTime)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-4 space-y-3">
          {/* Status Actions */}
          {appointment.status === "PENDING" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => onStatusChange?.(appointment.id, "CONFIRMED")}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {tCommon("confirm")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onStatusChange?.(appointment.id, "CANCELLED")}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                {tCommon("cancel")}
              </Button>
            </div>
          )}
          {appointment.status === "CONFIRMED" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onStatusChange?.(appointment.id, "COMPLETED")}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {t("markComplete")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onStatusChange?.(appointment.id, "CANCELLED")}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                {tCommon("cancel")}
              </Button>
            </div>
          )}

          {/* See Details Link */}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => onViewCustomer?.(appointment.user.id)}
          >
            {t("seeDetails")}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Badge */}
        <div className="absolute bottom-4 right-4 hidden">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
            {formatTime(startTime)} - {formatTime(endTime)}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
