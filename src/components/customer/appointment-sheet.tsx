"use client";

import { format, parseISO, isPast } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Banknote,
  FileText,
  CalendarClock,
  X,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

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

interface AppointmentSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  companySlug: string;
  t: ReturnType<typeof useTranslations<"appointments">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusIcons: Record<string, string> = {
  PENDING: "clock",
  CONFIRMED: "check-circle",
  CANCELLED: "x-circle",
  COMPLETED: "check-circle-2",
};

export function AppointmentSheet({
  appointment,
  open,
  onOpenChange,
  onCancel,
  isCancelling,
  companySlug,
  t,
  tCommon,
}: AppointmentSheetProps) {
  if (!appointment) return null;

  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const isAppointmentPast = isPast(startTime);
  const canCancel =
    !isAppointmentPast &&
    appointment.status !== "CANCELLED" &&
    appointment.status !== "COMPLETED";
  const canReschedule = canCancel;
  const serviceColor = appointment.service.color || "#3B82F6";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>

        <SheetHeader className="text-left px-4 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${serviceColor}20` }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: serviceColor }}
              />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {appointment.service.name}
              </SheetTitle>
              <SheetDescription>{t("appointmentDetails")}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 space-y-4 overflow-y-auto">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tCommon("status")}:</span>
            <Badge
              className={statusColors[appointment.status]}
              variant="outline"
            >
              {t(appointment.status.toLowerCase())}
            </Badge>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tCommon("date")}</p>
                <p className="font-medium">
                  {format(startTime, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tCommon("time")}</p>
                <p className="font-medium">
                  {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")} (
                  {appointment.service.duration} min)
                </p>
              </div>
            </div>

            {/* Price */}
            {appointment.service.price > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tCommon("price")}</p>
                  <p className="font-medium">
                    {appointment.service.price.toLocaleString()}{" "}
                    {appointment.service.currency}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("notes")}</p>
                  <p className="font-medium">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 px-4 pt-6 pb-8">
          {canReschedule && (
            <Link
              href={`/c/${companySlug}/book?service=${appointment.service.id}`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full gap-2">
                <CalendarClock className="h-4 w-4" />
                {t("reschedule")}
              </Button>
            </Link>
          )}

          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  {tCommon("cancel")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cancelAppointment")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("cancelConfirmation")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("back")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onCancel(appointment.id);
                      onOpenChange(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("confirmCancel")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!canCancel && !canReschedule && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("close")}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
