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
import { GlobalAppointmentsList } from "@/components/customer/global-appointments-list";
import { APPOINTMENTS_CHANNEL, type AppointmentEvent } from "@/lib/broadcast-channel";

interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}


interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  companyId?: string;
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
  const tGlobal = useTranslations("globalAppointments");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // View state
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [scope, setScope] = useState<"all" | "company">("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[] | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const storageKey = `appointments-service-filter-${companySlug}`;
  const viewModeStorageKey = `appointments-view-mode-${companySlug}`;
  const scopeStorageKey = `appointments-scope`;

  // Current appointments based on scope
  const currentAppointments = scope === "all" ? allAppointments : appointments;

  // Get unique companies with appointment counts (for global view)
  const companiesWithCounts = useMemo(() => {
    const companyMap = new Map<string, { company: Company; count: number }>();
    allAppointments
      .filter(a => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED" && a.company)
      .forEach(apt => {
        if (!apt.company) return;
        const existing = companyMap.get(apt.company.id);
        if (existing) {
          existing.count++;
        } else {
          companyMap.set(apt.company.id, {
            company: apt.company,
            count: 1,
          });
        }
      });
    return Array.from(companyMap.values());
  }, [allAppointments]);

  // Get unique services with counts for filter badges
  const servicesWithCounts = useMemo(() => {
    const serviceMap = new Map<string, { id: string; name: string; color: string | null; count: number }>();
    currentAppointments
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
  }, [currentAppointments]);

  // Get all service IDs for "all active" default
  const allServiceIds = useMemo(() =>
    servicesWithCounts.map(s => s.id),
    [servicesWithCounts]
  );

  // Initialize scope from localStorage
  useEffect(() => {
    try {
      const savedScope = localStorage.getItem(scopeStorageKey);
      if (savedScope === "all" || savedScope === "company") {
        setScope(savedScope);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [scopeStorageKey]);

  // Save scope to localStorage when it changes
  const handleScopeChange = useCallback((newScope: "all" | "company") => {
    setScope(newScope);
    try {
      localStorage.setItem(scopeStorageKey, newScope);
    } catch {
      // Ignore localStorage errors
    }
  }, [scopeStorageKey]);

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

  // Filter appointments based on status, selected services, and date range
  const filteredAppointments = useMemo(() => {
    let filtered = currentAppointments;

    // Status filter (all, upcoming, past, confirmed, pending, cancelled)
    if (filterStatus === "upcoming") {
      filtered = filtered.filter(a => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED");
    } else if (filterStatus === "past") {
      filtered = filtered.filter(a => isPast(parseISO(a.startTime)) || a.status === "COMPLETED");
    } else if (filterStatus === "confirmed") {
      filtered = filtered.filter(a => a.status === "CONFIRMED");
    } else if (filterStatus === "pending") {
      filtered = filtered.filter(a => a.status === "PENDING");
    } else if (filterStatus === "cancelled") {
      filtered = filtered.filter(a => a.status === "CANCELLED");
    }
    // "all" shows everything

    // Service filter (only for company view - "all" view has per-company badges that don't filter)
    if (scope === "company" && selectedServiceIds !== null && selectedServiceIds.length > 0 &&
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
  }, [currentAppointments, scope, selectedServiceIds, allServiceIds, dateRange, filterStatus]);

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
      const [appointmentsRes, allAppointmentsRes, workingHoursRes] = await Promise.all([
        fetch(`/api/c/${companySlug}/appointments?myOnly=true&all=true`, { cache: 'no-store' }),
        fetch(`/api/user/appointments`, { cache: 'no-store' }),
        fetch(`/api/c/${companySlug}/working-hours`, { cache: 'no-store' }),
      ]);

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setAppointments(data);
      } else if (appointmentsRes.status === 401) {
        router.push(`/login?callbackUrl=/c/${companySlug}/my-appointments`);
        return;
      }

      if (allAppointmentsRes.ok) {
        const data = await allAppointmentsRes.json();
        setAllAppointments(data);
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

  // Listen for broadcast messages from chat widget when a booking is made
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(APPOINTMENTS_CHANNEL);
    channel.onmessage = (event: MessageEvent<AppointmentEvent>) => {
      if (event.data.type === "new-booking") {
        // Increment refresh key to force re-render of all components
        setRefreshKey(prev => prev + 1);
        loadData(); // Refetch appointments
      }
    };

    return () => channel.close();
  }, [loadData]);

  async function handleCancel(appointmentId: string, cancelCompanySlug?: string) {
    setCancellingId(appointmentId);
    const slugToUse = cancelCompanySlug || companySlug;

    try {
      const response = await fetch(
        `/api/c/${slugToUse}/appointments/${appointmentId}`,
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
        appointments={currentAppointments}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        scope={scope}
        onScopeChange={handleScopeChange}
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
            closedDays={scope === "company" ? closedDays : []}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            servicesWithCounts={scope === "company" ? servicesWithCounts : []}
            selectedServiceIds={selectedServiceIds}
            onServiceToggle={handleServiceToggle}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            t={t}
          />
        ) : scope === "all" ? (
          // Global list view - show all appointments grouped by company
          <GlobalAppointmentsList
            appointments={filteredAppointments as (Appointment & { company: Company })[]}
            companiesWithCounts={companiesWithCounts}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onCancel={(aptId, aptCompanySlug) => handleCancel(aptId, aptCompanySlug)}
            cancellingId={cancellingId}
            t={t}
            tGlobal={tGlobal}
            tCommon={tCommon}
          />
        ) : (
          // Company-specific list view
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
        onCancel={(aptId) => handleCancel(aptId, scope === "all" ? selectedAppointment?.company?.slug : undefined)}
        isCancelling={cancellingId === selectedAppointment?.id}
        companySlug={scope === "all" && selectedAppointment?.company ? selectedAppointment.company.slug : companySlug}
        t={t}
        tCommon={tCommon}
      />
    </div>
  );
}
