"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, subDays } from "date-fns";
import { srLatn, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CalendarHeader,
  WeekGridView,
  CalendarFilterBar,
  AppointmentDetailModal,
  CreateAppointmentModal,
  Appointment,
  Service,
  FilterState,
  DatePeriod,
} from "@/components/admin/calendar";

export default function AppointmentsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("id"); // For deep-linking from dashboard
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const tCalendar = useTranslations("calendar");
  const locale = useLocale();
  const dateLocale = locale === "sr" ? srLatn : enUS;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companyTimezone, setCompanyTimezone] = useState<string>("Europe/Belgrade");
  const [primaryColor, setPrimaryColor] = useState<string | undefined>(undefined);
  const [workingHours, setWorkingHours] = useState<Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOpen: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialDate, setCreateModalInitialDate] = useState<Date | undefined>();
  const [createModalInitialTime, setCreateModalInitialTime] = useState<string | undefined>();
  const lastOpenedDeepLinkId = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  // Initialize state from URL params
  const initialViewMode = (searchParams.get("view") as "schedule" | "table") || "schedule";
  const initialDate = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();
  const initialStatuses = searchParams.get("statuses")?.split(",").filter(Boolean) || ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
  const initialServices = searchParams.get("services")?.split(",").filter(Boolean) || [];

  const [viewMode, setViewMode] = useState<"schedule" | "table">(initialViewMode);
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Loading state for individual appointment status updates
  const [loadingAppointments, setLoadingAppointments] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterState>({
    services: initialServices,
    statuses: initialStatuses as FilterState["statuses"],
  });

  // Table view specific state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  type SortField = "date" | "service" | "customer" | "status";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Update URL when filters, view mode, or date change
  const updateUrl = useCallback((
    newFilters: FilterState,
    newViewMode: "schedule" | "table",
    newDate: Date
  ) => {
    const params = new URLSearchParams();

    // Only add non-default values to URL
    if (newFilters.services.length > 0) {
      params.set("services", newFilters.services.join(","));
    }

    // Only add statuses if not all are selected
    const allStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (newFilters.statuses.length > 0 && newFilters.statuses.length < allStatuses.length) {
      params.set("statuses", newFilters.statuses.join(","));
    }

    if (newViewMode !== "schedule") {
      params.set("view", newViewMode);
    }

    // Always include date for persistence
    params.set("date", format(newDate, "yyyy-MM-dd"));

    // Preserve deep-link appointment id if present
    const currentId = searchParams.get("id");
    if (currentId) {
      params.set("id", currentId);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : "";
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Effect to update URL when filters, view mode, or date change
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary URL update
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateUrl(filters, viewMode, currentDate);
  }, [filters, viewMode, currentDate, updateUrl]);

  // Load appointments, services, company settings, and working hours
  useEffect(() => {
    loadAppointments();
    loadServices();
    loadCompanySettings();
    loadWorkingHours();
  }, [companySlug]);

  async function loadCompanySettings() {
    try {
      const response = await fetch(`/api/c/${companySlug}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.timezone) {
          setCompanyTimezone(data.timezone);
        }
        if (data.primaryColor) {
          setPrimaryColor(data.primaryColor);
        }
      }
    } catch (error) {
      console.error("Failed to load company settings:", error);
    }
  }

  // Initialize service filters when services are loaded (only if not set from URL)
  useEffect(() => {
    if (services.length > 0 && filters.services.length === 0 && initialServices.length === 0) {
      setFilters((prev) => ({
        ...prev,
        services: services.map((s) => s.id),
      }));
    }
  }, [services, initialServices.length]);

  // Auto-open appointment from URL parameter (deep-linking from dashboard)
  useEffect(() => {
    if (appointmentId && !isLoading && appointments.length > 0 && lastOpenedDeepLinkId.current !== appointmentId) {
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        lastOpenedDeepLinkId.current = appointmentId;
        setSelectedAppointment(appointment);
        setIsDetailModalOpen(true);
        // Navigate to the appointment's date
        setCurrentDate(parseISO(appointment.startTime));
      }
    }
  }, [appointmentId, isLoading, appointments]);

  async function loadAppointments() {
    try {
      const response = await fetch(`/api/c/${companySlug}/appointments`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadServices() {
    try {
      const response = await fetch(`/api/c/${companySlug}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Failed to load services:", error);
    }
  }

  async function loadWorkingHours() {
    try {
      const response = await fetch(`/api/c/${companySlug}/working-hours`);
      if (response.ok) {
        const data = await response.json();
        setWorkingHours(data);
      }
    } catch (error) {
      console.error("Failed to load working hours:", error);
    }
  }

  async function updateStatus(
    appointmentId: string,
    status: Appointment["status"],
    cancellationReason?: string
  ) {
    // Store previous state for rollback
    const previousAppointments = [...appointments];
    const previousSelectedAppointment = selectedAppointment;

    // Add to loading set
    setLoadingAppointments((prev) => new Set(prev).add(appointmentId));

    // Optimistic update
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status } : apt
      )
    );

    // Update selected appointment if it's the one being changed
    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment((prev) =>
        prev ? { ...prev, status } : null
      );
    }

    try {
      const body: { status: string; cancellationReason?: string } = { status };
      if (cancellationReason) {
        body.cancellationReason = cancellationReason;
      }

      const response = await fetch(
        `/api/c/${companySlug}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update status");
      }

      toast.success(tCalendar("statusUpdated"));
      // Reload to get full updated data including any side effects
      loadAppointments();
      setIsDetailModalOpen(false);
    } catch (error) {
      // Revert optimistic update on error
      setAppointments(previousAppointments);
      setSelectedAppointment(previousSelectedAppointment);
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      // Remove from loading set
      setLoadingAppointments((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  }

  // Filter appointments with date range support for table view
  const filteredAppointments = useMemo(() => {
    let filtered = appointments.filter((apt) => {
      const serviceMatch =
        filters.services.length === 0 ||
        (apt.service.id && filters.services.includes(apt.service.id));
      const statusMatch =
        filters.statuses.length === 0 || filters.statuses.includes(apt.status);
      return serviceMatch && statusMatch;
    });

    // Apply search filter for table view
    if (viewMode === "table" && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((apt) => {
        const customerName = (apt.user.name || "").toLowerCase();
        const customerEmail = (apt.user.email || "").toLowerCase();
        const serviceName = apt.service.name.toLowerCase();
        const status = apt.status.toLowerCase();
        return (
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          serviceName.includes(query) ||
          status.includes(query)
        );
      });
    }

    // Apply date filter only for table view
    if (viewMode === "table" && datePeriod !== "all") {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date = endOfDay(now);

      if (datePeriod === "7d") {
        startDate = startOfDay(subDays(now, 7));
      } else if (datePeriod === "30d") {
        startDate = startOfDay(subDays(now, 30));
      } else if (datePeriod === "90d") {
        startDate = startOfDay(subDays(now, 90));
      } else if (datePeriod === "custom" && customDateFrom && customDateTo) {
        startDate = startOfDay(new Date(customDateFrom));
        endDate = endOfDay(new Date(customDateTo));
      }

      if (startDate) {
        filtered = filtered.filter((apt) => {
          const aptDate = parseISO(apt.startTime);
          return isWithinInterval(aptDate, { start: startDate!, end: endDate });
        });
      }
    }

    // Sort for table view
    if (viewMode === "table") {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case "date":
            comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            break;
          case "service":
            comparison = a.service.name.localeCompare(b.service.name);
            break;
          case "customer":
            const nameA = a.user.name || a.user.email || "";
            const nameB = b.user.name || b.user.email || "";
            comparison = nameA.localeCompare(nameB);
            break;
          case "status":
            const statusOrder = { PENDING: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3 };
            comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) -
                        (statusOrder[b.status as keyof typeof statusOrder] || 0);
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [appointments, filters, viewMode, datePeriod, customDateFrom, customDateTo, searchQuery, sortField, sortDirection]);

  // Toggle sort direction or change field
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  // Pagination for table view
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = useMemo(() => {
    if (viewMode !== "table") return filteredAppointments;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAppointments, currentPage, itemsPerPage, viewMode]);

  // Group paginated appointments by date
  const paginatedGroupedAppointments = useMemo(() => {
    if (viewMode !== "table") return new Map<string, Appointment[]>();

    const groups = new Map<string, Appointment[]>();
    paginatedAppointments.forEach((apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(apt);
    });
    return groups;
  }, [paginatedAppointments, viewMode]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, datePeriod, customDateFrom, customDateTo, searchQuery, sortField, sortDirection]);

  // Selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === paginatedAppointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedAppointments.map((apt) => apt.id)));
    }
  }

  function toggleSelectOne(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  // Clear selection when changing view mode
  useEffect(() => {
    setSelectedIds(new Set());
  }, [viewMode]);

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  }, []);

  const handleAddAppointment = useCallback(() => {
    setCreateModalInitialDate(undefined);
    setCreateModalInitialTime(undefined);
    setIsCreateModalOpen(true);
  }, []);

  const handleSlotClick = useCallback((date: Date, time: string) => {
    setCreateModalInitialDate(date);
    setCreateModalInitialTime(time);
    setIsCreateModalOpen(true);
  }, []);

  function getStatusBadge(status: Appointment["status"]) {
    const variants: Record<
      Appointment["status"],
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
    > = {
      PENDING: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3 mr-1" />,
      },
      CONFIRMED: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
      CANCELLED: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
      COMPLETED: {
        variant: "outline",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
    };

    const { variant, icon } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {t(`status${status.charAt(0)}${status.slice(1).toLowerCase()}`)}
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {/* Calendar controls row */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateChange={setCurrentDate}
        onAddAppointment={handleAddAppointment}
        datePeriod={datePeriod}
        onDatePeriodChange={setDatePeriod}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        onCustomDateChange={(from, to) => {
          setCustomDateFrom(from);
          setCustomDateTo(to);
        }}
        primaryColor={primaryColor}
        appointmentCount={filteredAppointments.length}
      />

      {/* Horizontal filter bar */}
      <CalendarFilterBar
        services={services}
        appointments={appointments}
        filters={filters}
        onFiltersChange={setFilters}
        showSearch={viewMode === "table"}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Calendar/Table content - full width */}
      {viewMode === "schedule" ? (
        <WeekGridView
          currentDate={currentDate}
          appointments={filteredAppointments}
          onAppointmentClick={handleAppointmentClick}
          onSlotClick={handleSlotClick}
          timezone={companyTimezone}
          workingHours={workingHours}
        />
      ) : (
        // Table View
        <div className="space-y-4">
          {/* Selection Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-muted/50 px-4 py-3 rounded-lg animate-fade-in">
              <span className="text-sm font-medium">
                {selectedIds.size} {selectedIds.size !== 1 ? t("appointmentsSelected") : t("appointmentSelected")}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const selectedApts = paginatedAppointments.filter((apt) => selectedIds.has(apt.id));
                    const pendingApts = selectedApts.filter((apt) => apt.status === "PENDING");
                    if (pendingApts.length > 0) {
                      pendingApts.forEach((apt) => updateStatus(apt.id, "CONFIRMED"));
                    }
                  }}
                  disabled={!paginatedAppointments.some((apt) => selectedIds.has(apt.id) && apt.status === "PENDING")}
                  style={primaryColor ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  {t("confirmSelected")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => {
                    const selectedApts = paginatedAppointments.filter((apt) => selectedIds.has(apt.id));
                    const cancellableApts = selectedApts.filter((apt) => apt.status === "PENDING" || apt.status === "CONFIRMED");
                    if (cancellableApts.length > 0) {
                      cancellableApts.forEach((apt) => updateStatus(apt.id, "CANCELLED"));
                    }
                  }}
                  disabled={!paginatedAppointments.some((apt) => selectedIds.has(apt.id) && (apt.status === "PENDING" || apt.status === "CONFIRMED"))}
                >
                  {t("cancelSelected")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  {t("clearSelection")}
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t("noAppointments")}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={paginatedAppointments.length > 0 && selectedIds.size === paginatedAppointments.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label={t("selectAll")}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {tCommon("time")}
                        {sortField === "date" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("service")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {t("service")}
                        {sortField === "service" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button
                        onClick={() => handleSort("customer")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {t("customer")}
                        {sortField === "customer" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {tCommon("status")}
                        {sortField === "status" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(paginatedGroupedAppointments.entries()).map(([dateKey, dayAppointments]) => (
                    <React.Fragment key={dateKey}>
                      {/* Date Group Header */}
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={6} className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {format(new Date(dateKey), "EEEE, MMMM d, yyyy", { locale: dateLocale })}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {dayAppointments.length} {dayAppointments.length === 1 ? t("appointment") : t("appointmentsCount")}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Appointments for this date */}
                      {dayAppointments.map((apt) => (
                        <TableRow
                          key={apt.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedIds.has(apt.id) && "bg-primary/5"
                          )}
                          onClick={() => handleAppointmentClick(apt)}
                          data-state={selectedIds.has(apt.id) ? "selected" : undefined}
                        >
                          <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(apt.id)}
                              onCheckedChange={() => toggleSelectOne(apt.id)}
                              aria-label={`Select ${apt.service.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {format(parseISO(apt.startTime), "HH:mm")}
                            </span>
                            <span className="text-muted-foreground"> - </span>
                            <span>{format(parseISO(apt.endTime), "HH:mm")}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: apt.service.color || "#3B82F6" }}
                              />
                              {apt.service.name}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <div className="font-medium">
                                {apt.user.name || t("noName")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {apt.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(apt.status)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {apt.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(apt.id, "CONFIRMED");
                                  }}
                                  style={primaryColor ? { borderColor: primaryColor, color: primaryColor } : undefined}
                                >
                                  {t("confirm")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(apt.id, "CANCELLED");
                                  }}
                                >
                                  {tCommon("cancel")}
                                </Button>
                              </div>
                            )}
                            {apt.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(apt.id, "COMPLETED");
                                }}
                              >
                                {t("complete")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("showing")} {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAppointments.length)} {t("of")} {filteredAppointments.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and adjacent pages
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-1 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0"
                            style={currentPage === page && primaryColor ? { backgroundColor: primaryColor } : undefined}
                          >
                            {page}
                          </Button>
                        </span>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Appointment Detail Panel */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onStatusChange={updateStatus}
        onAppointmentUpdated={loadAppointments}
        isLoading={selectedAppointment ? loadingAppointments.has(selectedAppointment.id) : false}
        primaryColor={primaryColor}
        services={services}
        companySlug={companySlug}
      />

      {/* Create Appointment Panel */}
      <CreateAppointmentModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        services={services}
        companySlug={companySlug}
        onAppointmentCreated={loadAppointments}
        initialDate={createModalInitialDate}
        initialTime={createModalInitialTime}
        primaryColor={primaryColor}
      />
    </div>
  );
}
