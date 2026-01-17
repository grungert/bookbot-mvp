"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import {
  CalendarHeader,
  WeekGridView,
  CalendarFiltersSidebar,
  PatientQueue,
  AppointmentDetailModal,
  Appointment,
  Service,
  FilterState,
} from "@/components/admin/calendar";

export default function AppointmentsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const tCalendar = useTranslations("calendar");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"schedule" | "table">("schedule");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    services: [],
    statuses: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
  });

  // Load appointments and services
  useEffect(() => {
    loadAppointments();
    loadServices();
  }, [companySlug]);

  // Initialize service filters when services are loaded
  useEffect(() => {
    if (services.length > 0 && filters.services.length === 0) {
      setFilters((prev) => ({
        ...prev,
        services: services.map((s) => s.id),
      }));
    }
  }, [services]);

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
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to load services:", error);
    }
  }

  async function updateStatus(
    appointmentId: string,
    status: Appointment["status"]
  ) {
    try {
      const response = await fetch(
        `/api/c/${companySlug}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(tCalendar("statusUpdated"));
      loadAppointments();
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error(tCommon("error"));
    }
  }

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const serviceMatch =
        filters.services.length === 0 ||
        (apt.service.id && filters.services.includes(apt.service.id));
      const statusMatch =
        filters.statuses.length === 0 || filters.statuses.includes(apt.status);
      return serviceMatch && statusMatch;
    });
  }, [appointments, filters]);

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
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

  const SidebarContent = () => (
    <div className="space-y-4">
      <CalendarFiltersSidebar
        services={services}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <PatientQueue
        appointments={appointments}
        onAppointmentClick={handleAppointmentClick}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {/* Mobile filter button */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle>{tCalendar("filters")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - desktop only */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-4 space-y-6">
            <SidebarContent />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onDateChange={setCurrentDate}
          />

          {viewMode === "schedule" ? (
            <WeekGridView
              currentDate={currentDate}
              appointments={filteredAppointments}
              onAppointmentClick={handleAppointmentClick}
            />
          ) : (
            // Table View
            filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t("noAppointments")}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tCommon("date")}</TableHead>
                        <TableHead>{tCommon("time")}</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="hidden md:table-cell">Customer</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                        <TableHead className="text-right">{tCommon("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((apt) => (
                        <TableRow
                          key={apt.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          <TableCell>
                            {format(parseISO(apt.startTime), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(apt.startTime), "HH:mm")} -{" "}
                            {format(parseISO(apt.endTime), "HH:mm")}
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
                                {apt.user.name || "No name"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {apt.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(apt.status)}</TableCell>
                          <TableCell className="text-right">
                            {apt.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(apt.id, "CONFIRMED");
                                  }}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(apt.id, "CANCELLED");
                                  }}
                                >
                                  Cancel
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
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onStatusChange={updateStatus}
      />
    </div>
  );
}
