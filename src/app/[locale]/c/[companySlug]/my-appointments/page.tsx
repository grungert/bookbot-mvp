"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isPast, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[] | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const storageKey = `appointments-service-filter-${companySlug}`;
  const viewModeStorageKey = `appointments-view-mode-${companySlug}`;

  // Get unique services with counts for filter badges
  const servicesWithCounts = useMemo(() => {
    const serviceMap = new Map<string, { id: string; name: string; color: string | null; count: number }>();
    appointments
      .filter(a => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED")
      .forEach(apt => {
        const existing = serviceMap.get(apt.service.id);
        if (existing) {
          existing.count++;
        } else {
          serviceMap.set(apt.service.id, {
            id: apt.service.id,
            name: apt.service.name,
            color: apt.service.color,
            count: 1,
          });
        }
      });
    return Array.from(serviceMap.values());
  }, [appointments]);

  // Get all service IDs for "all active" default
  const allServiceIds = useMemo(() =>
    servicesWithCounts.map(s => s.id),
    [servicesWithCounts]
  );

  // Initialize selected services from localStorage or default to all
  useEffect(() => {
    if (servicesWithCounts.length === 0) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Filter to only include services that still exist
        const validIds = parsed.filter(id => allServiceIds.includes(id));
        setSelectedServiceIds(validIds.length > 0 ? validIds : allServiceIds);
      } else {
        // Default: all services selected
        setSelectedServiceIds(allServiceIds);
      }
    } catch {
      setSelectedServiceIds(allServiceIds);
    }
  }, [servicesWithCounts, allServiceIds, storageKey]);

  // Save to localStorage when selection changes
  useEffect(() => {
    if (selectedServiceIds !== null) {
      localStorage.setItem(storageKey, JSON.stringify(selectedServiceIds));
    }
  }, [selectedServiceIds, storageKey]);

  // Initialize view mode from localStorage
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem(viewModeStorageKey);
      if (savedViewMode === "calendar" || savedViewMode === "list") {
        setViewMode(savedViewMode);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [viewModeStorageKey]);

  // Save view mode to localStorage when it changes
  const handleViewModeChange = useCallback((mode: "calendar" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem(viewModeStorageKey, mode);
    } catch {
      // Ignore localStorage errors
    }
  }, [viewModeStorageKey]);

  // Filter appointments based on selected services and date range
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Service filter
    if (selectedServiceIds !== null && selectedServiceIds.length > 0 &&
        selectedServiceIds.length !== allServiceIds.length) {
      filtered = filtered.filter(a => selectedServiceIds.includes(a.service.id));
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.startTime);
        if (dateRange.to) {
          return isWithinInterval(aptDate, {
            start: startOfDay(dateRange.from!),
            end: endOfDay(dateRange.to)
          });
        }
        return aptDate >= startOfDay(dateRange.from!);
      });
    }

    return filtered;
  }, [appointments, selectedServiceIds, allServiceIds, dateRange]);

  // Toggle service filter
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev === null) return [serviceId];
      return prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
    });
  };

  const loadData = useCallback(async () => {
    try {
      const [appointmentsRes, workingHoursRes] = await Promise.all([
        fetch(`/api/c/${companySlug}/appointments?myOnly=true`),
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
      <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background">
      <AppointmentsHeader
        appointments={appointments}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        companySlug={companySlug}
        t={t}
      />

      <div className="container mx-auto px-4 py-6">
        {viewMode === "calendar" ? (
          <AppointmentsCalendar
            appointments={filteredAppointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectAppointment={handleSelectAppointment}
            closedDays={closedDays}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            servicesWithCounts={servicesWithCounts}
            selectedServiceIds={selectedServiceIds}
            onServiceToggle={handleServiceToggle}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            t={t}
          />
        ) : (
          <AppointmentsList
            appointments={filteredAppointments}
            onSelectAppointment={handleSelectAppointment}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            companySlug={companySlug}
            servicesWithCounts={servicesWithCounts}
            selectedServiceIds={selectedServiceIds}
            onServiceToggle={handleServiceToggle}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
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
