"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Calendar, Clock, Loader2, X, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

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

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function MyAppointmentsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      const response = await fetch(`/api/c/${companySlug}/appointments`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else if (response.status === 401) {
        router.push(`/login?callbackUrl=/c/${companySlug}/my-appointments`);
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, router, tCommon]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

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
      loadAppointments();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setCancellingId(null);
    }
  }

  const upcomingAppointments = appointments.filter(
    (a) => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED"
  );

  const pastAppointments = appointments.filter(
    (a) => isPast(parseISO(a.startTime)) || a.status === "CANCELLED"
  );

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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/c/${companySlug}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t("myAppointments")}</h1>
              <p className="text-muted-foreground">{t("viewAndManage")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Upcoming Appointments */}
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("upcoming")}</h2>
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("noUpcoming")}</p>
                <Link href={`/c/${companySlug}/book`}>
                  <Button>{t("bookNow")}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancel}
                  isCancelling={cancellingId === appointment.id}
                  t={t}
                  tCommon={tCommon}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">{t("past")}</h2>
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancel}
                  isCancelling={cancellingId === appointment.id}
                  isPast
                  t={t}
                  tCommon={tCommon}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  isCancelling,
  isPast = false,
  t,
  tCommon,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  isPast?: boolean;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const canCancel = !isPast && appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED";

  return (
    <Card className={isPast ? "opacity-75" : ""}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: appointment.service.color || "#3B82F6" }}
              />
              <h3 className="font-semibold text-lg">{appointment.service.name}</h3>
              <Badge className={statusColors[appointment.status]} variant="outline">
                {t(appointment.status.toLowerCase())}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(parseISO(appointment.startTime), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(parseISO(appointment.startTime), "h:mm a")}</span>
              </div>
            </div>
            {appointment.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">{t("notes")}:</span> {appointment.notes}
              </p>
            )}
          </div>

          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <X className="h-4 w-4 mr-1" />
                  {tCommon("cancel")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cancelAppointment")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("cancelConfirmation")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("back")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(appointment.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("confirmCancel")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
