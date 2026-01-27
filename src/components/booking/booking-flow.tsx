"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { format, parseISO, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle, Loader2, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ServicePriceDisplay } from "@/components/service/service-price-display";
import { PromotionalBadge } from "@/components/service/promotional-badge";
import {
  calculateDiscountedPrice,
  formatPrice,
  getSavingsText,
  isDiscountActive,
  type PromotionalBadge as PromotionalBadgeType,
} from "@/lib/utils/discount";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  color: string | null;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  promotionalBadge?: PromotionalBadgeType;
  customBadgeLabel?: string | null;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface UserAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: {
    name: string;
    color?: string | null;
  };
}

interface WorkingHours {
  dayOfWeek: number;
  isOpen: boolean;
}

interface BookingFlowProps {
  companySlug: string;
  services: Service[];
  initialServiceId?: string;
  user?: UserInfo | null;
}

type BookingStep = "service" | "date" | "details" | "confirm" | "success";

export function BookingFlow({
  companySlug,
  services,
  initialServiceId,
  user,
}: BookingFlowProps) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const isGuest = !user;

  const [step, setStep] = useState<BookingStep>(
    initialServiceId ? "date" : "service"
  );
  const [stepDirection, setStepDirection] = useState<"forward" | "back">("forward");
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialServiceId
      ? services.find((s) => s.id === initialServiceId) || null
      : null
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest details
  const [guestName, setGuestName] = useState(user?.name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "");

  // User's existing appointments
  const [userAppointments, setUserAppointments] = useState<UserAppointment[]>([]);

  // Closed days (days where isOpen = false)
  const [closedDays, setClosedDays] = useState<number[]>([]);

  // Load user's appointments on mount (only for logged-in users)
  const loadUserAppointments = useCallback(async () => {
    if (isGuest) return;

    try {
      const response = await fetch(`/api/c/${companySlug}/appointments?myOnly=true`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only upcoming appointments
        const upcoming = data.filter((apt: UserAppointment) =>
          new Date(apt.startTime) >= new Date() &&
          apt.status !== "CANCELLED"
        );
        setUserAppointments(upcoming);
      }
    } catch {
      // Silently fail - not critical
    }
  }, [companySlug, isGuest]);

  // Load working hours to determine closed days
  const loadWorkingHours = useCallback(async () => {
    try {
      const response = await fetch(`/api/c/${companySlug}/working-hours`);
      if (response.ok) {
        const workingHours: WorkingHours[] = await response.json();
        // Get days that are open
        const openDays = workingHours
          .filter((wh) => wh.isOpen)
          .map((wh) => wh.dayOfWeek);
        // All days not in openDays are closed (0=Sun, 1=Mon, ..., 6=Sat)
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        const closed = allDays.filter((day) => !openDays.includes(day));
        setClosedDays(closed);
      }
    } catch {
      // Silently fail - not critical
    }
  }, [companySlug]);

  useEffect(() => {
    loadUserAppointments();
    loadWorkingHours();
  }, [loadUserAppointments, loadWorkingHours]);

  // Get dates that have appointments
  const appointmentDates = userAppointments.map(apt => parseISO(apt.startTime));

  // Get appointments for a specific date
  function getAppointmentsForDate(date: Date) {
    return userAppointments.filter(apt =>
      isSameDay(parseISO(apt.startTime), date)
    );
  }

  // Get unique service colors for a specific date
  function getColorsForDate(date: Date): string[] {
    const appointments = getAppointmentsForDate(date);
    const colors = [...new Set(appointments.map(apt => apt.service.color || "#3B82F6"))];
    return colors;
  }

  // Get tooltip content for a date with appointments
  function getTooltipForDate(date: Date): React.ReactNode {
    const appointments = getAppointmentsForDate(date);
    if (appointments.length === 0) return null;

    return (
      <div className="space-y-1.5 py-1">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {t("yourAppointments")}:
        </div>
        {appointments.map((apt) => (
          <div key={apt.id} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: apt.service.color || "#3B82F6" }}
            />
            <span className="font-medium">{apt.service.name}</span>
            <span className="text-muted-foreground">
              {format(parseISO(apt.startTime), "HH:mm")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  async function loadSlots(date: Date, serviceId: string) {
    setIsLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/c/${companySlug}/slots?date=${dateStr}&serviceId=${serviceId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load slots");
      }

      const data = await response.json();
      setSlots(data.slots.filter((s: TimeSlot) => s.available));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoadingSlots(false);
    }
  }

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setStepDirection("forward");
    setStep("date");
  }

  // Ref to scroll time slots into view
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);
    if (date && selectedService) {
      loadSlots(date, selectedService.id);
      // Stay on date step — slots appear inline below calendar
    }
  }

  // Scroll time slots into view when they load
  useEffect(() => {
    if (selectedDate && !isLoadingSlots && slots.length > 0 && timeSlotsRef.current) {
      const el = timeSlotsRef.current;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "end" });
      });
    }
  }, [selectedDate, isLoadingSlots, slots.length, prefersReducedMotion]);

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStepDirection("forward");
    // If guest, show details form; otherwise go to confirm
    if (isGuest) {
      setStep("details");
    } else {
      setStep("confirm");
    }
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) {
      toast.error(t("detailsRequired"));
      return;
    }
    setStepDirection("forward");
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return;

    // Validate guest details if guest checkout
    if (isGuest && (!guestName.trim() || !guestEmail.trim())) {
      toast.error(t("detailsRequired"));
      setStep("details");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: Record<string, unknown> = {
        serviceId: selectedService.id,
        startTime: selectedSlot.start,
        notes: notes || undefined,
      };

      // Add guest details if guest checkout
      if (isGuest) {
        requestBody.guestName = guestName.trim();
        requestBody.guestEmail = guestEmail.trim();
        requestBody.guestPhone = guestPhone.trim() || undefined;
      }

      const response = await fetch(`/api/c/${companySlug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create booking");
      }

      setStep("success");
      toast.success(t("bookingSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("bookingError")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    setStepDirection("back");
    switch (step) {
      case "date":
        setStep("service");
        break;
      case "details":
        setStep("date");
        break;
      case "confirm":
        setStep(isGuest ? "details" : "date");
        break;
    }
  }

  // Helper to get animation class based on direction
  const getStepAnimationClass = () => {
    if (prefersReducedMotion) return "";
    return stepDirection === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";
  };

  // Step indicator - different for guests
  const steps = isGuest
    ? [
        { key: "service", label: t("selectService") },
        { key: "date", label: t("selectDateTime") },
        { key: "details", label: t("yourDetails") },
        { key: "confirm", label: t("confirmBooking") },
      ]
    : [
        { key: "service", label: t("selectService") },
        { key: "date", label: t("selectDateTime") },
        { key: "confirm", label: t("confirmBooking") },
      ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className={cn("mx-auto", step === "date" && selectedDate ? "max-w-4xl" : "max-w-2xl", "transition-[max-width] duration-300")}>
      {/* Progress Steps */}
      {step !== "success" && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  i <= currentStepIndex
                    ? "bg-primary text-primary-foreground scale-100"
                    : "bg-muted text-muted-foreground scale-95"
                )}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="w-12 h-1 mx-2 bg-muted overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full bg-primary transition-transform duration-300 ease-out origin-left",
                      i < currentStepIndex ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Selection */}
      {step === "service" && (
        <Card className={getStepAnimationClass()}>
          <CardHeader>
            <CardTitle>{t("selectService")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((service, index) => {
              const hasPromotion = isDiscountActive(service) || service.promotionalBadge || service.customBadgeLabel;
              const priceResult = isDiscountActive(service) ? calculateDiscountedPrice(service) : null;

              return (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className={cn(
                  "w-full border rounded-lg hover:border-primary hover:bg-muted/50 transition-all duration-200 text-left hover-lift press-feedback relative overflow-hidden",
                  !prefersReducedMotion && "animate-fade-up",
                  !prefersReducedMotion && index > 0 && `stagger-${Math.min(index, 5)}`
                )}
                style={!prefersReducedMotion ? { opacity: 0 } : undefined}
              >
                {/* Promotional strip at top */}
                {hasPromotion && (
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: service.color || "#3B82F6" }}
                  />
                )}

                <div className={cn("p-4", hasPromotion && "pt-3")}>
                {/* Promotional Badge & Discount info */}
                {hasPromotion && (
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed">
                    <div className="flex items-center gap-2">
                      {(service.promotionalBadge || service.customBadgeLabel) && (
                        <PromotionalBadge
                          badge={service.promotionalBadge}
                          customLabel={service.customBadgeLabel}
                          size="sm"
                        />
                      )}
                    </div>
                    {priceResult && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">
                          {service.currency} {priceResult.originalPrice.toLocaleString()}
                        </span>
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-xs font-medium">
                          -{priceResult.discountPercentage}%
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {service.currency} {Math.round(priceResult.finalPrice).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div
                      className="w-1 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: service.color || "#3B82F6", height: "calc(100% - 4px)" }}
                    />
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{t("minutes", { count: service.duration })}</span>
                      </div>
                    </div>
                  </div>
                  {/* Show price badge only when NO discount (discount shown in header) */}
                  {!priceResult && (
                    <Badge
                      style={{
                        backgroundColor: service.color || undefined,
                        borderColor: service.color || undefined,
                      }}
                    >
                      {service.currency} {Number(service.price).toLocaleString()}
                    </Badge>
                  )}
                </div>
                </div>
              </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Date & Time Selection */}
      {step === "date" && selectedService && (
        <Card className={getStepAnimationClass()}>
          <CardHeader>
            <CardTitle>{t("selectDateTime")}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedService.color || "#3B82F6" }}
              />
              {selectedService.name} - {t("minutes", { count: selectedService.duration })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "flex flex-col gap-4",
              selectedDate && "lg:flex-row lg:gap-6 lg:items-start"
            )}>
              {/* Left side: Calendar + legend */}
              <div className="flex flex-col items-center gap-4 lg:shrink-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    // Disable past dates
                    if (date < new Date()) return true;
                    // Disable closed days (non-working days)
                    if (closedDays.includes(date.getDay())) return true;
                    return false;
                  }}
                  className="rounded-md border"
                  getDayIndicators={getColorsForDate}
                  getDayTooltip={getTooltipForDate}
                />
                {userAppointments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      {t("datesWithAppointments")}:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {userAppointments
                        .filter((apt, i, arr) =>
                          arr.findIndex(a => a.service.name === apt.service.name) === i
                        )
                        .map((apt) => (
                          <div key={apt.service.name} className="flex items-center gap-1.5 text-xs">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: apt.service.color || "#3B82F6" }}
                            />
                            <span>{apt.service.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side: Time slots — shown when a date is selected */}
              {selectedDate && (
                <div
                  key={selectedDate.toISOString()}
                  ref={timeSlotsRef}
                  className={cn(
                    "w-full min-w-0 space-y-4",
                    !prefersReducedMotion && "animate-fade-up"
                  )}
                >
                  <div className="border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                    <h3 className="text-sm font-medium text-center lg:text-left mb-1">
                      {t("selectTime")}
                    </h3>
                    <p className="text-xs text-muted-foreground text-center lg:text-left mb-4">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>

                    {/* Show user's existing appointments on this date */}
                    {getAppointmentsForDate(selectedDate).length > 0 && (
                      <div className="bg-primary/10 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarCheck className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{t("yourAppointmentsOnDate")}</span>
                        </div>
                        <div className="space-y-2">
                          {getAppointmentsForDate(selectedDate).map((apt) => (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between text-sm bg-background/50 rounded px-3 py-2"
                            >
                              <span className="font-medium flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: apt.service.color || "#3B82F6" }}
                                />
                                {apt.service.name}
                              </span>
                              <span className="text-muted-foreground">
                                {format(parseISO(apt.startTime), "HH:mm")} - {format(parseISO(apt.endTime), "HH:mm")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isLoadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-center lg:text-left py-8 text-muted-foreground">
                        {t("noAvailableSlots")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                        {slots.map((slot, index) => (
                          <Button
                            key={slot.start}
                            variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                            onClick={() => handleSlotSelect(slot)}
                            className={cn(
                              "w-full press-feedback",
                              !prefersReducedMotion && "animate-fade-up",
                              !prefersReducedMotion && `stagger-${Math.min((index % 5) + 1, 5)}`
                            )}
                            style={!prefersReducedMotion ? { opacity: 0 } : undefined}
                          >
                            {format(parseISO(slot.start), "HH:mm")}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" onClick={goBack}>
              {tCommon("back")}
            </Button>
          </div>
        </Card>
      )}

      {/* Guest Details Form */}
      {step === "details" && selectedService && selectedDate && selectedSlot && (
        <Card className={getStepAnimationClass()}>
          <CardHeader>
            <CardTitle>{t("yourDetails")}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedService.color || "#3B82F6" }}
              />
              {selectedService.name} • {format(selectedDate, "MMM d")} • {format(parseISO(selectedSlot.start), "HH:mm")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleDetailsSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">{tCommon("name")} *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">{tCommon("email")} *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPhone">{tCommon("phone")}</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                />
              </div>
            </CardContent>
            <div className="px-6 pb-6 flex gap-2">
              <Button type="button" variant="outline" onClick={goBack}>
                {tCommon("back")}
              </Button>
              <Button type="submit" className="flex-1">
                {tCommon("next")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirmation */}
      {step === "confirm" && selectedService && selectedDate && selectedSlot && (() => {
        const discountResult = calculateDiscountedPrice(selectedService);
        const savingsText = getSavingsText(discountResult, selectedService.currency);
        return (
        <Card className={getStepAnimationClass()}>
          <CardHeader>
            <CardTitle>{t("confirmBooking")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("service")}:</span>
                <span className="font-medium flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedService.color || "#3B82F6" }}
                  />
                  {selectedService.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("dateTime")}:</span>
                <span className="font-medium">
                  {format(selectedDate, "MMM d, yyyy")} at{" "}
                  {format(parseISO(selectedSlot.start), "HH:mm")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tCommon("duration")}:</span>
                <span className="font-medium">
                  {t("minutes", { count: selectedService.duration })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{tCommon("price")}:</span>
                {discountResult.isDiscounted ? (
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(discountResult.originalPrice, selectedService.currency)}
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatPrice(Math.round(discountResult.finalPrice), selectedService.currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="font-medium">
                    {selectedService.currency}{" "}
                    {Number(selectedService.price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* You save message */}
            {savingsText && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg text-center">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {savingsText}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                placeholder={t("notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <div className="px-6 pb-6 flex gap-2">
            <Button variant="outline" onClick={goBack}>
              {tCommon("back")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {tCommon("confirm")}
            </Button>
          </div>
        </Card>
        );
      })()}

      {/* Success */}
      {step === "success" && (
        <Card className={!prefersReducedMotion ? "animate-fade-in-scale" : ""}>
          <CardContent className="py-12 text-center">
            <div className={!prefersReducedMotion ? "animate-success-bounce" : ""}>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            </div>
            <h2
              className={cn(
                "text-2xl font-bold mb-2",
                !prefersReducedMotion && "animate-fade-up stagger-2"
              )}
              style={!prefersReducedMotion ? { opacity: 0 } : undefined}
            >
              {t("bookingSuccess")}
            </h2>
            <p
              className={cn(
                "text-muted-foreground mb-6",
                !prefersReducedMotion && "animate-fade-up stagger-3"
              )}
              style={!prefersReducedMotion ? { opacity: 0 } : undefined}
            >
              {t("appointmentPending")}
            </p>
            <Button
              onClick={() => router.push(`/c/${companySlug}`)}
              className={cn(
                !prefersReducedMotion && "animate-fade-up stagger-4"
              )}
              style={!prefersReducedMotion ? { opacity: 0 } : undefined}
            >
              {tCommon("back")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
