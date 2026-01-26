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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface AppointmentDetailData {
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
  company?: Company;
}

export interface AppointmentDetailSheetProps {
  appointment: AppointmentDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  companySlug: string;
  showCompany?: boolean;
  t: ReturnType<typeof useTranslations<"appointments">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onCancel,
  isCancelling,
  companySlug,
  showCompany = false,
  t,
  tCommon,
}: AppointmentDetailSheetProps) {
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
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-0">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
        </div>

        {/* Service color strip */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: serviceColor }}
        />

        <div className="flex flex-col overflow-hidden">
          {/* Company card (global view only) */}
          {showCompany && appointment.company && (
            <div className="px-5 pt-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Avatar
                  className="h-10 w-10 border-2"
                  style={{
                    borderColor:
                      appointment.company.primaryColor || "#3B82F6",
                  }}
                >
                  <AvatarImage
                    src={appointment.company.logoUrl || undefined}
                    alt={appointment.company.name}
                  />
                  <AvatarFallback
                    style={{
                      backgroundColor: hexToRgba(
                        appointment.company.primaryColor || "#3B82F6",
                        0.1
                      ),
                    }}
                  >
                    {appointment.company.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{appointment.company.name}</p>
              </div>
            </div>
          )}

          <SheetHeader className="text-left px-5 pt-4 pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: serviceColor }}
                />
                <SheetTitle className="text-lg">
                  {appointment.service.name}
                </SheetTitle>
              </div>
              <Badge
                className={statusColors[appointment.status]}
                variant="outline"
              >
                {t(
                  appointment.status.toLowerCase() as
                    | "pending"
                    | "confirmed"
                    | "cancelled"
                    | "completed"
                )}
              </Badge>
            </div>
            <SheetDescription className="sr-only">
              {t("appointmentDetails")}
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 pt-4">
            <Separator />
          </div>

          {/* Detail rows */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tCommon("date")}</p>
                <p className="text-sm font-medium">
                  {format(startTime, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tCommon("time")}</p>
                <p className="text-sm font-medium">
                  {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")} (
                  {appointment.service.duration} min)
                </p>
              </div>
            </div>

            {/* Price */}
            {appointment.service.price > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tCommon("price")}</p>
                  <p className="text-sm font-medium">
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
                  <p className="text-xs text-muted-foreground">{t("notes")}</p>
                  <p className="text-sm font-medium">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>

          <Separator className="mx-5" />

          {/* Actions */}
          <SheetFooter className="flex-row gap-3 px-5 pt-4 pb-8">
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
                    <AlertDialogTitle>
                      {t("cancelAppointment")}
                    </AlertDialogTitle>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
