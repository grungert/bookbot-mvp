"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingFlowProps {
  companySlug: string;
  services: Service[];
  initialServiceId?: string;
}

type BookingStep = "service" | "date" | "time" | "confirm" | "success";

export function BookingFlow({
  companySlug,
  services,
  initialServiceId,
}: BookingFlowProps) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [step, setStep] = useState<BookingStep>(
    initialServiceId ? "date" : "service"
  );
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
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsLoadingSlots(false);
    }
  }

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setStep("date");
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);
    if (date && selectedService) {
      loadSlots(date, selectedService.id);
      setStep("time");
    }
  }

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          startTime: selectedSlot.start,
          notes: notes || undefined,
        }),
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
    switch (step) {
      case "date":
        setStep("service");
        break;
      case "time":
        setStep("date");
        break;
      case "confirm":
        setStep("time");
        break;
    }
  }

  // Step indicator
  const steps = [
    { key: "service", label: t("selectService") },
    { key: "date", label: t("selectDate") },
    { key: "time", label: t("selectTime") },
    { key: "confirm", label: t("confirmBooking") },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      {step !== "success" && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  i <= currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-1 mx-2",
                    i < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Selection */}
      {step === "service" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectService")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="w-full p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition text-left"
              >
                <div className="flex justify-between items-start">
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
                  <Badge>
                    {service.currency} {Number(service.price).toLocaleString()}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Date Selection */}
      {step === "date" && selectedService && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectDate")}</CardTitle>
            <CardDescription>
              {selectedService.name} - {t("minutes", { count: selectedService.duration })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" onClick={goBack}>
              {tCommon("back")}
            </Button>
          </div>
        </Card>
      )}

      {/* Time Selection */}
      {step === "time" && selectedService && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectTime")}</CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {t("noAvailableSlots")}
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.start}
                    variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                    onClick={() => handleSlotSelect(slot)}
                    className="w-full"
                  >
                    {format(parseISO(slot.start), "HH:mm")}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" onClick={goBack}>
              {tCommon("back")}
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmation */}
      {step === "confirm" && selectedService && selectedDate && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>{t("confirmBooking")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("service")}:</span>
                <span className="font-medium">{selectedService.name}</span>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tCommon("price")}:</span>
                <span className="font-medium">
                  {selectedService.currency}{" "}
                  {Number(selectedService.price).toLocaleString()}
                </span>
              </div>
            </div>

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
      )}

      {/* Success */}
      {step === "success" && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("bookingSuccess")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("appointmentPending")}
            </p>
            <Button onClick={() => router.push(`/c/${companySlug}`)}>
              {tCommon("back")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
