"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, TableIcon, CalendarIcon } from "lucide-react";
import { AppointmentCalendar } from "@/components/admin/appointment-calendar";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  service: {
    name: string;
    duration: number;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export default function AppointmentsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  useEffect(() => {
    loadAppointments();
  }, [companySlug, statusFilter]);

  async function loadAppointments() {
    try {
      const url =
        statusFilter === "all"
          ? `/api/c/${companySlug}/appointments`
          : `/api/c/${companySlug}/appointments?status=${statusFilter}`;

      const response = await fetch(url);
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

      toast.success("Status updated");
      loadAppointments();
    } catch (error) {
      toast.error(tCommon("error"));
    }
  }

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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "calendar")}>
            <TabsList>
              <TabsTrigger value="table" className="gap-1">
                <TableIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
              <SelectItem value="CONFIRMED">{t("statusConfirmed")}</SelectItem>
              <SelectItem value="COMPLETED">{t("statusCompleted")}</SelectItem>
              <SelectItem value="CANCELLED">{t("statusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "table" ? (
        // Table View
        appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t("noAppointments")}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        {format(parseISO(apt.startTime), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(apt.startTime), "HH:mm")} -{" "}
                        {format(parseISO(apt.endTime), "HH:mm")}
                      </TableCell>
                      <TableCell>{apt.service.name}</TableCell>
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
                              onClick={() => updateStatus(apt.id, "CONFIRMED")}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(apt.id, "CANCELLED")}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {apt.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(apt.id, "COMPLETED")}
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
      ) : (
        // Calendar View
        <AppointmentCalendar appointments={appointments} />
      )}
    </div>
  );
}
