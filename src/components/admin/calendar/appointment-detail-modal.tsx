"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { srLatn, enUS } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Loader2,
  Pencil,
  CalendarIcon,
  Save,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment } from "./appointment-card";
import { Service } from "./calendar-filters-sidebar";
import { toast } from "sonner";

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (appointmentId: string, status: Appointment["status"], cancellationReason?: string) => void;
  onAppointmentUpdated?: () => void;
  isLoading?: boolean;
  primaryColor?: string;
  services?: Service[];
  companySlug?: string;
}

const statusStyles: Record<
  Appointment["status"],
  { color: string; textColor: string }
> = {
  PENDING: { color: "bg-amber-500", textColor: "text-amber-700" },
  CONFIRMED: { color: "bg-emerald-500", textColor: "text-emerald-700" },
  CANCELLED: { color: "bg-gray-400", textColor: "text-gray-600" },
  COMPLETED: { color: "bg-green-500", textColor: "text-green-700" },
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

// Generate time options from 00:00 to 23:30 in 30-minute intervals
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push({ value, label: value });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function AppointmentDetailModal({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
  onAppointmentUpdated,
  isLoading = false,
  primaryColor,
  services = [],
  companySlug,
}: AppointmentDetailModalProps) {
  const t = useTranslations("calendar");
  const tAppointments = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const tBooking = useTranslations("booking");
  const locale = useLocale();
  const dateLocale = locale === "sr" ? srLatn : enUS;

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editTime, setEditTime] = useState<string>("");
  const [editServiceId, setEditServiceId] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  // Reset edit state when appointment changes or modal opens
  useEffect(() => {
    if (appointment && open) {
      const startTime = parseISO(appointment.startTime);
      setEditDate(startTime);
      setEditTime(formatTime(startTime));
      setEditServiceId(appointment.service.id || "");
      setEditNotes(appointment.notes || "");
      setIsEditMode(false);
    }
  }, [appointment, open]);

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    if (appointment) {
      onStatusChange?.(appointment.id, "CANCELLED", cancellationReason || undefined);
    }
    setShowCancelDialog(false);
    setCancellationReason("");
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setCancellationReason("");
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset to original values
      if (appointment) {
        const startTime = parseISO(appointment.startTime);
        setEditDate(startTime);
        setEditTime(formatTime(startTime));
        setEditServiceId(appointment.service.id || "");
        setEditNotes(appointment.notes || "");
      }
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = async () => {
    if (!appointment || !companySlug || !editDate) return;

    // Parse time and create datetime
    const [hours, minutes] = editTime.split(":").map(Number);
    const newStartTime = setMinutes(setHours(startOfDay(editDate), hours), minutes);

    setIsSaving(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: newStartTime.toISOString(),
          serviceId: editServiceId,
          notes: editNotes.trim() || null,
          sendNotification: true, // Flag to send notification to user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update appointment");
      }

      toast.success(t("appointmentUpdated"));
      setIsEditMode(false);
      onAppointmentUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!appointment) return null;

  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const displayName = appointment.user.name || appointment.user.email.split("@")[0];
  const { color, textColor } = statusStyles[appointment.status];

  const selectedService = services.find(s => s.id === editServiceId) || appointment.service;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] flex flex-col p-0 shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{t("appointmentDetails")}</SheetTitle>
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  {tCommon("cancel")}
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">
              View and manage appointment details
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Customer Info */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  {appointment.user.image ? (
                    <AvatarImage src={appointment.user.image} alt={displayName} />
                  ) : null}
                  <AvatarFallback
                    className="text-base font-semibold text-white"
                    style={{ backgroundColor: primaryColor || "#3B82F6" }}
                  >
                    {getInitials(appointment.user.name, appointment.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{appointment.user.email}</span>
                    </div>
                    {appointment.user.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{appointment.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Service & Status */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t("typeTreatment")}
                  </Label>
                  {isEditMode && services.length > 0 ? (
                    <Select value={editServiceId} onValueChange={setEditServiceId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: service.color || "#3B82F6" }}
                              />
                              {service.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: selectedService.color || "#3B82F6" }}
                      />
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    {tCommon("status")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full", color)} />
                    <span className={cn("font-medium", textColor)}>
                      {tAppointments(`status${appointment.status.charAt(0)}${appointment.status.slice(1).toLowerCase()}`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-6 border-b">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("appointmentTime")}
              </Label>

              {isEditMode ? (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label className="text-sm">{tBooking("selectDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editDate ? format(editDate, "PPP", { locale: dateLocale }) : tBooking("selectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editDate}
                          onSelect={setEditDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{tBooking("selectTime")}</Label>
                    <Select value={editTime} onValueChange={setEditTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: primaryColor || "#3B82F6" }}
                    />
                    <div
                      className="w-0.5 h-8"
                      style={{ backgroundColor: primaryColor ? `${primaryColor}40` : "#3B82F640" }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: primaryColor || "#3B82F6" }}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("start")}</span>
                      <div className="text-right">
                        <span className="font-semibold text-lg">{formatTime(startTime)}</span>
                        <p className="text-xs text-muted-foreground">
                          {format(startTime, "EEEE, MMM d, yyyy", { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("end")}</span>
                      <span className="font-semibold text-lg">{formatTime(endTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="p-6">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                {tBooking("notes")}
              </Label>
              {isEditMode ? (
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={tBooking("notesPlaceholder")}
                  className="mt-2"
                  rows={3}
                />
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {appointment.notes || "No notes"}
                </p>
              )}
            </div>

            {/* Notifications */}
            {(appointment.notificationLog || appointment.bookingChannel) && (
              <div className="p-6 border-t">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("notificationStatus") || "Notifications"}
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {appointment.bookingChannel && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {t("bookedVia") || "Booked via"}:{" "}
                      {(() => {
                        switch (appointment.bookingChannel) {
                          case "bot": return t("sourceBot");
                          case "whatsapp": return t("sourceWhatsapp");
                          case "admin": return t("sourceAdmin");
                          case "website":
                          case "web":
                          default: return t("sourceWebsite");
                        }
                      })()}
                    </span>
                  )}
                  {appointment.notificationLog?.email && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        appointment.notificationLog.email.success
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      <Mail className="h-3 w-3" />
                      {appointment.notificationLog.email.success
                        ? (t("emailSent") || "Email sent")
                        : (t("emailFailed") || "Email failed")}
                    </span>
                  )}
                  {appointment.notificationLog?.whatsapp && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        appointment.notificationLog.whatsapp.success
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {appointment.notificationLog.whatsapp.success
                        ? (t("whatsappSent") || "WhatsApp sent")
                        : (t("whatsappFailed") || "WhatsApp failed")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="border-t p-6 space-y-3 mt-auto">
            {isEditMode ? (
              <Button
                className="w-full h-11 text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {tCommon("save")}
              </Button>
            ) : (
              <div className="flex gap-3">
                {/* Action Button - changes based on status */}
                {appointment.status === "PENDING" && (
                  <Button
                    className="flex-1 h-11 text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => onStatusChange?.(appointment.id, "CONFIRMED")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {tCommon("confirm")}
                  </Button>
                )}
                {appointment.status === "CONFIRMED" && (
                  <Button
                    className="flex-1 h-11 text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => onStatusChange?.(appointment.id, "COMPLETED")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t("markComplete")}
                  </Button>
                )}

                {/* Edit Button - available for PENDING and CONFIRMED */}
                {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={handleEditToggle}
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {tCommon("edit")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancellation Reason Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={handleCancelDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>{tAppointments("cancelAppointment")}</DialogTitle>
          <DialogDescription>
            {tAppointments("cancelConfirmation")}
          </DialogDescription>
          <div className="py-4">
            <Label htmlFor="cancellation-reason" className="text-sm font-medium">
              {t("cancellationReason")}
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder={t("cancellationReasonPlaceholder")}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDialogClose}>
              {tCommon("back")}
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm}>
              {tAppointments("confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
