"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  CalendarPlus,
  X,
  ExternalLink,
  Banknote,
  FileText,
  Loader2,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Helper function to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  company: Company;
}

interface CompanyWithCount {
  company: Company;
  count: number;
}

interface GlobalAppointmentsListProps {
  appointments: Appointment[];
  companiesWithCounts: CompanyWithCount[];
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onCancel: (appointmentId: string, companySlug: string) => void;
  cancellingId: string | null;
  t: ReturnType<typeof useTranslations<"appointments">>;
  tGlobal: ReturnType<typeof useTranslations<"globalAppointments">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
};

export function GlobalAppointmentsList({
  appointments,
  companiesWithCounts,
  filterStatus,
  onFilterStatusChange,
  dateRange,
  onDateRangeChange,
  onCancel,
  cancellingId,
  t,
  tGlobal,
  tCommon,
}: GlobalAppointmentsListProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter appointments based on status filter and search query
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.service.name.toLowerCase().includes(query) ||
          a.company.name.toLowerCase().includes(query) ||
          (a.notes && a.notes.toLowerCase().includes(query))
      );
    }

    if (filterStatus === "upcoming") {
      filtered = filtered.filter(
        (a) => !isPast(parseISO(a.startTime)) && a.status !== "CANCELLED"
      );
    } else if (filterStatus === "past") {
      filtered = filtered.filter(
        (a) => isPast(parseISO(a.startTime)) || a.status === "CANCELLED"
      );
    } else if (filterStatus !== "all") {
      filtered = filtered.filter(
        (a) => a.status.toLowerCase() === filterStatus
      );
    }

    // Sort by date based on sortOrder
    return filtered.sort((a, b) => {
      const aTime = parseISO(a.startTime).getTime();
      const bTime = parseISO(b.startTime).getTime();

      if (sortOrder === "asc") {
        return aTime - bTime; // Oldest first
      } else {
        return bTime - aTime; // Newest first
      }
    });
  }, [appointments, filterStatus, searchQuery, sortOrder]);

  // Group appointments by company
  const groupedByCompany = useMemo(() => {
    const groups = new Map<string, { company: Company; appointments: Appointment[] }>();

    filteredAppointments.forEach((apt) => {
      const existing = groups.get(apt.company.id);
      if (existing) {
        existing.appointments.push(apt);
      } else {
        groups.set(apt.company.id, {
          company: apt.company,
          appointments: [apt],
        });
      }
    });

    // Sort groups: companies with upcoming appointments first
    return Array.from(groups.values()).sort((a, b) => {
      const aHasUpcoming = a.appointments.some(apt =>
        !isPast(parseISO(apt.startTime)) && apt.status !== "CANCELLED"
      );
      const bHasUpcoming = b.appointments.some(apt =>
        !isPast(parseISO(apt.startTime)) && apt.status !== "CANCELLED"
      );

      if (aHasUpcoming === bHasUpcoming) {
        return a.company.name.localeCompare(b.company.name);
      }

      return aHasUpcoming ? -1 : 1;
    });
  }, [filteredAppointments]);

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSheetOpen(true);
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedAppointment) {
      onCancel(selectedAppointment.id, selectedAppointment.company.slug);
      setCancelDialogOpen(false);
      setSheetOpen(false);
    }
  };

  const canCancel = selectedAppointment &&
    !isPast(parseISO(selectedAppointment.startTime)) &&
    selectedAppointment.status !== "CANCELLED" &&
    selectedAppointment.status !== "COMPLETED";

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className={cn(
              "w-[180px] bg-card/80 backdrop-blur-sm transition-colors",
              filterStatus === "confirmed" && "border-green-500/50 hover:border-green-500/70 text-green-700",
              filterStatus === "pending" && "border-yellow-500/50 hover:border-yellow-500/70 text-yellow-700",
              filterStatus === "cancelled" && "border-red-500/50 hover:border-red-500/70 text-red-700",
              (filterStatus === "all" || filterStatus === "upcoming") && "border-primary/30 hover:border-primary/50 text-primary",
              filterStatus === "past" && "border-border/50 hover:border-border text-muted-foreground"
            )}>
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-md border-border/50">
              <SelectItem value="all" className={cn("cursor-pointer", filterStatus === "all" ? "bg-primary/10 text-primary font-medium" : "focus:bg-primary/10 focus:text-primary")}>{t("all")}</SelectItem>
              <SelectItem value="upcoming" className={cn("cursor-pointer", filterStatus === "upcoming" ? "bg-primary/10 text-primary font-medium" : "focus:bg-primary/10 focus:text-primary")}>{t("upcoming")}</SelectItem>
              <SelectItem value="past" className={cn("cursor-pointer", filterStatus === "past" ? "bg-muted font-medium" : "focus:bg-muted")}>{t("past")}</SelectItem>
              <SelectItem value="confirmed" className={cn("cursor-pointer", filterStatus === "confirmed" ? "bg-green-500/10 text-green-700 font-medium" : "focus:bg-green-500/10 focus:text-green-700")}>{t("confirmed")}</SelectItem>
              <SelectItem value="pending" className={cn("cursor-pointer", filterStatus === "pending" ? "bg-yellow-500/10 text-yellow-700 font-medium" : "focus:bg-yellow-500/10 focus:text-yellow-700")}>{t("pending")}</SelectItem>
              <SelectItem value="cancelled" className={cn("cursor-pointer", filterStatus === "cancelled" ? "bg-red-500/10 text-red-700 font-medium" : "focus:bg-red-500/10 focus:text-red-700")}>{t("cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal gap-2",
                  "bg-card/80 backdrop-blur-sm",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>{t("selectDateRange")}</span>
                )}
                {dateRange && (
                  <X
                    className="h-3 w-3 ml-1 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateRangeChange(undefined);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" container={containerRef.current}>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                defaultMonth={dateRange?.from}
              />
            </PopoverContent>
          </Popover>

          {/* Sort by date */}
          <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
            <SelectTrigger className="w-[160px] bg-card/80 backdrop-blur-sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-md border-border/50">
              <SelectItem value="asc" className="cursor-pointer">{tGlobal("oldestFirst")}</SelectItem>
              <SelectItem value="desc" className="cursor-pointer">{tGlobal("newestFirst")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tGlobal("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full sm:w-[250px] bg-card/80 backdrop-blur-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Company count info */}
      {companiesWithCounts.length > 1 && (
        <div className="text-sm text-muted-foreground">
          {tGlobal("companiesCount", { count: companiesWithCounts.length })}
        </div>
      )}

      {/* Appointment list grouped by company */}
      {groupedByCompany.length === 0 ? (
        <Card className="rounded-xl border bg-card/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t("noAppointments")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {groupedByCompany.map(({ company, appointments: companyAppointments }) => (
              <motion.div
                key={company.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                layout={!prefersReducedMotion}
                className="space-y-4"
              >
                {/* Company header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2" style={{ borderColor: company.primaryColor || "#3B82F6" }}>
                      <AvatarImage src={company.logoUrl || undefined} alt={company.name} />
                      <AvatarFallback style={{ backgroundColor: hexToRgba(company.primaryColor || "#3B82F6", 0.1) }}>
                        {company.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {companyAppointments.length} {companyAppointments.length === 1 ? t("appointment") : t("appointmentsCount")}
                      </p>
                    </div>
                  </div>

                  <Link href={`/c/${company.slug}/book`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarPlus className="h-4 w-4" />
                      {tGlobal("bookAgain")}
                    </Button>
                  </Link>
                </div>

                {/* Company appointments */}
                <div className="space-y-3 pl-2 border-l-2" style={{ borderColor: hexToRgba(company.primaryColor || "#3B82F6", 0.3) }}>
                  <AnimatePresence mode="popLayout">
                    {companyAppointments.map((appointment, cardIndex) => (
                      <motion.div
                        key={appointment.id}
                        variants={prefersReducedMotion ? undefined : itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                          duration: 0.2,
                          delay: cardIndex * 0.05,
                        }}
                        layout={!prefersReducedMotion}
                      >
                        <AppointmentCard
                          appointment={appointment}
                          onClick={() => handleSelectAppointment(appointment)}
                          t={t}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Appointment detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{t("appointmentDetails")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Company info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10 border-2" style={{ borderColor: selectedAppointment.company.primaryColor || "#3B82F6" }}>
                    <AvatarImage src={selectedAppointment.company.logoUrl || undefined} alt={selectedAppointment.company.name} />
                    <AvatarFallback style={{ backgroundColor: hexToRgba(selectedAppointment.company.primaryColor || "#3B82F6", 0.1) }}>
                      {selectedAppointment.company.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedAppointment.company.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.service.name}</p>
                  </div>
                  <Badge className={cn("text-xs", statusColors[selectedAppointment.status])} variant="outline">
                    {t(selectedAppointment.status.toLowerCase() as "pending" | "confirmed" | "cancelled" | "completed")}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(selectedAppointment.startTime), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(selectedAppointment.startTime), "h:mm a")} ({selectedAppointment.service.duration} min)</span>
                  </div>
                  {selectedAppointment.service.price > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAppointment.service.price.toLocaleString()} {selectedAppointment.service.currency}</span>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div className="flex items-start gap-3 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{selectedAppointment.notes}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4">
                  <Link href={`/c/${selectedAppointment.company.slug}/book?service=${selectedAppointment.service.id}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {t("reschedule")}
                    </Button>
                  </Link>
                  {canCancel && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleCancelClick}
                      disabled={cancellingId === selectedAppointment.id}
                    >
                      {cancellingId === selectedAppointment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t("confirmCancel")}
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full" onClick={() => setSheetOpen(false)}>
                    {tCommon("close")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelAppointment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onClick,
  t,
}: {
  appointment: Appointment;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<"appointments">>;
}) {
  const startTime = parseISO(appointment.startTime);
  const isAppointmentPast = isPast(startTime) || appointment.status === "CANCELLED";
  const serviceColor = appointment.service.color || "#3B82F6";

  return (
    <Card
      className={cn(
        "cursor-pointer group overflow-hidden",
        "rounded-xl border bg-gradient-to-br to-transparent",
        "shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20 ml-4",
        isAppointmentPast && "opacity-60"
      )}
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${hexToRgba(serviceColor, 0.05)}, transparent)`
      }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Service color bar */}
            <div
              className="w-1.5 h-14 rounded-full shrink-0"
              style={{ backgroundColor: serviceColor }}
            />

            {/* Time display */}
            <div
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] rounded-lg p-2",
                "transition-all duration-300 group-hover:scale-105"
              )}
              style={{ backgroundColor: hexToRgba(serviceColor, 0.1) }}
            >
              <span className="text-lg font-bold">{format(startTime, "h:mm")}</span>
              <span className="text-xs text-muted-foreground">{format(startTime, "a")}</span>
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold transition-colors duration-200 group-hover:text-primary">
                  {appointment.service.name}
                </h4>
                <Badge
                  className={cn("text-xs", statusColors[appointment.status])}
                  variant="outline"
                >
                  {t(appointment.status.toLowerCase() as "pending" | "confirmed" | "cancelled" | "completed")}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{format(startTime, "MMM d")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{appointment.service.duration} min</span>
                </div>
                {appointment.service.price > 0 && (
                  <>
                    <span>•</span>
                    <span>{appointment.service.price.toLocaleString()} {appointment.service.currency}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}
