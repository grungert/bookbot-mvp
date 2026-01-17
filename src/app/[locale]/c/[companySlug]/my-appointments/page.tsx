"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppointmentsHeader } from "@/components/customer/appointments-header";
import { AppointmentsCalendar } from "@/components/customer/appointments-calendar";
import { AppointmentsList } from "@/components/customer/appointments-list";
import { AppointmentSheet } from "@/components/customer/appointment-sheet";

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

interface WorkingHours {
  dayOfWeek: number;
  isOpen: boolean;
}

export default function MyAppointmentsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      const [appointmentsRes, workingHoursRes] = await Promise.all([
        fetch(`/api/c/${companySlug}/appointments`),
        fetch(`/api/c/${companySlug}/working-hours`),
      ]);

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setAppointments(data);
      } else if (appointmentsRes.status === 401) {
        router.push(`/login?callbackUrl=/c/${companySlug}/my-appointments`);
        return;
      }

      if (workingHoursRes.ok) {
        const workingHours: WorkingHours[] = await workingHoursRes.json();
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
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, router, tCommon]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCancel(appointmentId: string) {
    setCancellingId(appointmentId);

    try {
      const response = await fetch(
        `/api/c/${companySlug}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      toast.success(t("appointmentCancelled"));
      loadData();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setCancellingId(null);
    }
  }

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppointmentsHeader
        appointments={appointments}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        companySlug={companySlug}
        t={t}
      />

      <div className="container mx-auto px-4 py-6">
        {viewMode === "calendar" ? (
          <AppointmentsCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectAppointment={handleSelectAppointment}
            closedDays={closedDays}
            t={t}
          />
        ) : (
          <AppointmentsList
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            companySlug={companySlug}
            t={t}
          />
        )}
      </div>

      <AppointmentSheet
        appointment={selectedAppointment}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCancel={handleCancel}
        isCancelling={cancellingId === selectedAppointment?.id}
        companySlug={companySlug}
        t={t}
        tCommon={tCommon}
      />
    </div>
  );
}
