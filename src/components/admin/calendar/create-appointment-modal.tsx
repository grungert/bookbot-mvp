"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Loader2, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Service } from "./calendar-filters-sidebar";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface CreateAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  companySlug: string;
  onAppointmentCreated?: () => void;
  initialDate?: Date;
  initialTime?: string;
  primaryColor?: string;
}

// Generate time options from 00:00 to 23:30 in 30-minute intervals
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function CreateAppointmentModal({
  open,
  onOpenChange,
  services,
  companySlug,
  onAppointmentCreated,
  initialDate,
  initialTime,
  primaryColor,
}: CreateAppointmentModalProps) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const tBooking = useTranslations("booking");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // User selection mode: "existing" or "new"
  const [userMode, setUserMode] = useState<"existing" | "new">("new");

  // Form state
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Load existing users from appointments
  useEffect(() => {
    if (open) {
      loadExistingUsers();
    }
  }, [open, companySlug]);

  async function loadExistingUsers() {
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`/api/c/${companySlug}/appointments`);
      if (response.ok) {
        const appointments = await response.json();
        // Extract unique users from appointments
        const usersMap = new Map<string, User>();
        appointments.forEach((apt: { user: User }) => {
          if (apt.user && !usersMap.has(apt.user.id)) {
            usersMap.set(apt.user.id, apt.user);
          }
        });
        setExistingUsers(Array.from(usersMap.values()));
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedService("");
      setSelectedDate(initialDate || new Date());
      setSelectedTime(initialTime || "09:00");
      setUserMode("new");
      setSelectedUserId("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setNotes("");
    }
  }, [open, initialDate, initialTime]);

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const selectedUser = existingUsers.find((u) => u.id === selectedUserId);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!selectedService) return false;
    if (!selectedDate) return false;

    if (userMode === "existing") {
      return !!selectedUserId;
    } else {
      return !!guestName.trim() && !!guestEmail.trim();
    }
  }, [selectedService, selectedDate, userMode, selectedUserId, guestName, guestEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Parse time and create datetime
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startTime = setMinutes(setHours(startOfDay(selectedDate!), hours), minutes);

    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        serviceId: selectedService,
        startTime: startTime.toISOString(),
        notes: notes.trim() || undefined,
      };

      if (userMode === "existing" && selectedUser) {
        // Use existing user's details
        body.guestName = selectedUser.name || selectedUser.email.split("@")[0];
        body.guestEmail = selectedUser.email;
        body.guestPhone = selectedUser.phone || undefined;
      } else {
        // Use manually entered details
        body.guestName = guestName.trim();
        body.guestEmail = guestEmail.trim();
        body.guestPhone = guestPhone.trim() || undefined;
      }

      const response = await fetch(`/api/c/${companySlug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create appointment");
      }

      toast.success(tBooking("bookingSuccess"));
      onOpenChange(false);
      onAppointmentCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[500px] flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-xl">{t("addAppointment")}</SheetTitle>
          <SheetDescription>
            {tBooking("enterContactDetails")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 py-6 px-6">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">{tBooking("service")} *</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service" className={!selectedService ? "text-muted-foreground" : ""}>
                <SelectValue placeholder={tBooking("selectService")} />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: service.color || "#3B82F6" }}
                      />
                      <span>{service.name}</span>
                      <span className="text-muted-foreground">
                        ({service.duration} min)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tBooking("selectDate")} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>{tBooking("selectDate")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < startOfDay(new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">{tBooking("selectTime")} *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger id="time">
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

          {/* Appointment Preview */}
          {selectedServiceData && selectedDate && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>{selectedServiceData.name}</strong> on{" "}
              {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
              {selectedServiceData.duration && (
                <span> ({selectedServiceData.duration} min)</span>
              )}
            </div>
          )}

          {/* Customer Selection Mode */}
          <div className="space-y-3">
            <Label>{tBooking("yourDetails")} *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={userMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setUserMode("existing")}
                className="flex-1"
                style={userMode === "existing" && primaryColor ? { backgroundColor: primaryColor } : undefined}
              >
                <Users className="mr-2 h-4 w-4" />
                Existing Customer
              </Button>
              <Button
                type="button"
                variant={userMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setUserMode("new")}
                className="flex-1"
                style={userMode === "new" && primaryColor ? { backgroundColor: primaryColor } : undefined}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </div>
          </div>

          {/* Existing User Selection */}
          {userMode === "existing" && (
            <div className="space-y-2">
              <Label htmlFor="existingUser">Select Customer *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="existingUser" className={!selectedUserId ? "text-muted-foreground" : ""}>
                  <SelectValue placeholder={isLoadingUsers ? "Loading..." : "Select a customer"} />
                </SelectTrigger>
                <SelectContent>
                  {existingUsers.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No existing customers found
                    </div>
                  ) : (
                    existingUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.name || user.email.split("@")[0]}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedUser && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                  <p><strong>{selectedUser.name || "No name"}</strong></p>
                  <p>{selectedUser.email}</p>
                  {selectedUser.phone && <p>{selectedUser.phone}</p>}
                </div>
              )}
            </div>
          )}

          {/* New Customer Details */}
          {userMode === "new" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">{tCommon("name")} *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={tBooking("namePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail">{tCommon("email")} *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder={tBooking("emailPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">{tCommon("phone")}</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder={tBooking("phonePlaceholder")}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{tBooking("notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tBooking("notesPlaceholder")}
              rows={3}
            />
          </div>
        </form>

        <div className="border-t px-6 py-4 mt-auto">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-11"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              className="flex-1 h-11 text-white"
              style={primaryColor ? { backgroundColor: primaryColor } : undefined}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                tBooking("confirmBooking")
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
