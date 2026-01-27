"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, PackageOpen, ArrowUpDown, ArrowUp, ArrowDown, Percent, Tag, X, CalendarIcon, Search, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ServicePriceDisplay } from "@/components/service/service-price-display";
import { PromotionalBadge } from "@/components/service/promotional-badge";
import { isDiscountActive, type PromotionalBadge as PromotionalBadgeType } from "@/lib/utils/discount";

// Validation error interface
interface ValidationErrors {
  name?: string;
  duration?: string;
  price?: string;
  discountValue?: string;
  discountDates?: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  color: string | null;
  isActive: boolean;
  discountType: "percentage" | "fixed" | null;
  discountValue: number | null;
  discountStartDate: string | null;
  discountEndDate: string | null;
  promotionalBadge: PromotionalBadgeType;
  customBadgeLabel: string | null;
}

const DEFAULT_COLORS = [
  "#F97316", // Orange
  "#3B82F6", // Blue
  "#22C55E", // Green
  "#EF4444", // Red
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F59E0B", // Amber
];

export default function ServicesPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("services");
  const tCommon = useTranslations("common");

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"name" | "duration" | "price" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [discountFilter, setDiscountFilter] = useState<"all" | "with_discount" | "no_discount">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Form dirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const [showDirtyWarning, setShowDirtyWarning] = useState(false);
  const initialFormState = useRef<string>("");

  // Delete warning state (for services with appointments)
  const [deleteWarning, setDeleteWarning] = useState<{ serviceId: string; appointmentCount: number } | null>(null);
  const [isCheckingAppointments, setIsCheckingAppointments] = useState(false);

  // Toggle state
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);

  // Get primary color from CSS variable set by parent layout
  const [primaryColor, setPrimaryColor] = useState<string | undefined>(undefined);
  useEffect(() => {
    const el = document.querySelector("[data-theme-wrapper]") as HTMLElement;
    if (el) {
      const color = getComputedStyle(el).getPropertyValue("--company-primary").trim();
      if (color) setPrimaryColor(color);
    }
  }, []);

  // Body scroll lock when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPanelOpen]);

  // Escape key handler to close panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isPanelOpen) {
        if (isDirty) {
          setShowDirtyWarning(true);
        } else {
          closePanel();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, isDirty]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("0");
  const [color, setColor] = useState("");

  // Discount form state
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [discountDateRange, setDiscountDateRange] = useState<DateRange | undefined>(undefined);
  const [promotionalBadge, setPromotionalBadge] = useState<PromotionalBadgeType>(null);
  const [customBadgeLabel, setCustomBadgeLabel] = useState("");

  const loadServices = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      const response = await fetch(`/api/c/${companySlug}/services?${params}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || data);
        setTotalCount(data.total || data.length || 0);
        setCurrentPage(page);
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, tCommon]);

  useEffect(() => {
    loadServices(1);
  }, [loadServices]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, discountFilter]);

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services;

    // Apply search filter (client-side for instant feedback)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }

    // Apply discount filter
    if (discountFilter === "with_discount") {
      filtered = filtered.filter((s) => s.discountType && s.discountValue);
    } else if (discountFilter === "no_discount") {
      filtered = filtered.filter((s) => !s.discountType || !s.discountValue);
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        if (sortColumn === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (sortColumn === "duration") {
          comparison = a.duration - b.duration;
        } else if (sortColumn === "price") {
          comparison = Number(a.price) - Number(b.price);
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [services, searchQuery, discountFilter, sortColumn, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);
  const displayedServices = filteredAndSortedServices;

  // Selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === displayedServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedServices.map((s) => s.id)));
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

  // Sorting handler
  function handleSort(column: "name" | "duration" | "price") {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  // Get sort icon for column
  function getSortIcon(column: "name" | "duration" | "price") {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  }

  // Bulk delete handler
  async function handleBulkDelete() {
    setIsBulkDeleting(true);

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/c/${companySlug}/services/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
      const failCount = selectedIds.size - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} service(s) deleted successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} service(s)`);
      }

      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      loadServices(currentPage);
    } catch {
      toast.error("Failed to delete services. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // Get selected service names for confirmation
  function getSelectedServiceNames(): string[] {
    return services
      .filter((s) => selectedIds.has(s.id))
      .map((s) => s.name);
  }

  // Validate form fields
  function validateForm(): boolean {
    const errors: ValidationErrors = {};

    // Name validation
    if (!name.trim()) {
      errors.name = t("validation.nameRequired");
    }

    // Duration validation (5-480 minutes)
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 5 || durationNum > 480) {
      errors.duration = t("validation.durationRange");
    }

    // Price validation (>= 0)
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = t("validation.pricePositive");
    }

    // Discount validation
    if (discountType !== "none" && discountValue) {
      const discountNum = parseFloat(discountValue);
      if (discountType === "percentage" && (discountNum < 0 || discountNum > 100)) {
        errors.discountValue = t("validation.percentageRange");
      }
      if (discountType === "fixed" && discountNum > priceNum) {
        errors.discountValue = t("validation.fixedExceedsPrice");
      }
    }

    // Discount date validation
    if (discountType !== "none" && discountDateRange?.from && discountDateRange?.to) {
      if (discountDateRange.to <= discountDateRange.from) {
        errors.discountDates = t("validation.endAfterStart");
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Track form changes
  useEffect(() => {
    if (isPanelOpen) {
      const currentState = JSON.stringify({
        name, description, duration, price, color,
        discountType, discountValue, discountDateRange,
        promotionalBadge, customBadgeLabel
      });
      setIsDirty(currentState !== initialFormState.current);
    }
  }, [isPanelOpen, name, description, duration, price, color, discountType, discountValue, discountDateRange, promotionalBadge, customBadgeLabel]);

  // Quick toggle service active status
  async function handleToggleActive(service: Service) {
    setTogglingServiceId(service.id);
    try {
      const response = await fetch(`/api/c/${companySlug}/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || t("toggleError"));
        return;
      }

      toast.success(service.isActive ? t("serviceDeactivated") : t("serviceActivated"));
      loadServices(currentPage);
    } catch {
      toast.error(t("toggleError"));
    } finally {
      setTogglingServiceId(null);
    }
  }

  function openCreatePanel() {
    setEditingService(null);
    setName("");
    setDescription("");
    setDuration("60");
    setPrice("0");
    setColor("");
    setDiscountType("none");
    setDiscountValue("");
    setDiscountDateRange(undefined);
    setPromotionalBadge(null);
    setCustomBadgeLabel("");
    setValidationErrors({});
    setIsDirty(false);
    // Store initial form state for dirty tracking
    initialFormState.current = JSON.stringify({
      name: "", description: "", duration: "60", price: "0", color: "",
      discountType: "none", discountValue: "", discountDateRange: undefined,
      promotionalBadge: null, customBadgeLabel: ""
    });
    setIsPanelOpen(true);
  }

  function openEditPanel(service: Service) {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || "");
    setDuration(service.duration.toString());
    setPrice(service.price.toString());
    setColor(service.color || "");
    setDiscountType(service.discountType || "none");
    setDiscountValue(service.discountValue?.toString() || "");
    const dateRange = service.discountStartDate || service.discountEndDate
      ? {
          from: service.discountStartDate ? new Date(service.discountStartDate) : undefined,
          to: service.discountEndDate ? new Date(service.discountEndDate) : undefined,
        }
      : undefined;
    setDiscountDateRange(dateRange);
    setPromotionalBadge(service.promotionalBadge);
    setCustomBadgeLabel(service.customBadgeLabel || "");
    setValidationErrors({});
    setIsDirty(false);
    // Store initial form state for dirty tracking
    initialFormState.current = JSON.stringify({
      name: service.name,
      description: service.description || "",
      duration: service.duration.toString(),
      price: service.price.toString(),
      color: service.color || "",
      discountType: service.discountType || "none",
      discountValue: service.discountValue?.toString() || "",
      discountDateRange: dateRange,
      promotionalBadge: service.promotionalBadge,
      customBadgeLabel: service.customBadgeLabel || ""
    });
    setIsPanelOpen(true);
  }

  function closePanel() {
    setIsPanelOpen(false);
    setIsDirty(false);
    setValidationErrors({});
    setTimeout(() => {
      setEditingService(null);
    }, 300);
  }

  function handleCloseAttempt() {
    if (isDirty) {
      setShowDirtyWarning(true);
    } else {
      closePanel();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingService
        ? `/api/c/${companySlug}/services/${editingService.id}`
        : `/api/c/${companySlug}/services`;

      const requestBody: Record<string, unknown> = {
        name,
        description: description || undefined,
        duration: parseInt(duration),
        price: parseFloat(price),
        color: color || undefined,
      };

      // Add discount fields
      if (discountType !== "none" && discountValue) {
        requestBody.discountType = discountType;
        requestBody.discountValue = parseFloat(discountValue);
        requestBody.discountStartDate = discountDateRange?.from ? discountDateRange.from.toISOString() : null;
        requestBody.discountEndDate = discountDateRange?.to ? discountDateRange.to.toISOString() : null;
      } else {
        requestBody.discountType = null;
        requestBody.discountValue = null;
        requestBody.discountStartDate = null;
        requestBody.discountEndDate = null;
      }

      // Add promotional badge
      requestBody.promotionalBadge = promotionalBadge;
      requestBody.customBadgeLabel = customBadgeLabel || null;

      const response = await fetch(url, {
        method: editingService ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        // Parse specific error messages from API
        if (data.details?.fieldErrors) {
          const fieldErrors = data.details.fieldErrors;
          const errors: ValidationErrors = {};
          if (fieldErrors.name) errors.name = fieldErrors.name[0];
          if (fieldErrors.duration) errors.duration = fieldErrors.duration[0];
          if (fieldErrors.price) errors.price = fieldErrors.price[0];
          if (fieldErrors.discountValue) errors.discountValue = fieldErrors.discountValue[0];
          if (fieldErrors.discountEndDate) errors.discountDates = fieldErrors.discountEndDate[0];
          setValidationErrors(errors);
        }
        toast.error(data.error || t("error.saveFailed"));
        return;
      }

      toast.success(
        editingService ? t("serviceUpdated") : t("serviceCreated")
      );
      closePanel();
      loadServices(currentPage);
    } catch {
      toast.error(t("error.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check for appointments before showing delete confirmation
  async function checkAppointmentsBeforeDelete(serviceId: string) {
    setIsCheckingAppointments(true);
    try {
      const response = await fetch(
        `/api/c/${companySlug}/services/${serviceId}?checkAppointments=true`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.futureAppointmentCount > 0) {
          setDeleteWarning({ serviceId, appointmentCount: data.futureAppointmentCount });
          return;
        }
      }
      // No future appointments, proceed with delete
      handleDelete(serviceId);
    } catch {
      // On error, proceed with delete (API will handle validation)
      handleDelete(serviceId);
    } finally {
      setIsCheckingAppointments(false);
    }
  }

  async function handleDelete(serviceId: string) {
    setDeletingServiceId(serviceId);
    setDeleteWarning(null);

    try {
      const response = await fetch(
        `/api/c/${companySlug}/services/${serviceId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        // Handle specific error cases
        if (data.futureAppointmentCount) {
          toast.error(t("error.hasAppointments", { count: data.futureAppointmentCount }));
        } else {
          toast.error(data.error || t("error.deleteFailed"));
        }
        return;
      }

      toast.success(t("serviceDeleted"));
      loadServices(currentPage);
    } catch {
      toast.error(t("error.networkError"));
    } finally {
      setDeletingServiceId(null);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadServices(currentPage);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            onClick={openCreatePanel}
            style={primaryColor ? { backgroundColor: primaryColor } : undefined}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addService")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select
          value={discountFilter}
          onValueChange={(value: "all" | "with_discount" | "no_discount") => setDiscountFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-white">
            <SelectValue placeholder={t("filterByDiscount")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="with_discount">{t("filterWithDiscount")}</SelectItem>
            <SelectItem value="no_discount">{t("filterNoDiscount")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table Container */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {services.length === 0 && !searchQuery && discountFilter === "all" ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <PackageOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noServices")}</p>
            <Button
              onClick={openCreatePanel}
              variant="link"
              className="mt-2 text-primary"
            >
              {t("addService")}
            </Button>
          </div>
        ) : displayedServices.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noMatchingServices")}</p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setDiscountFilter("all");
              }}
              variant="link"
              className="mt-2 text-primary"
            >
              {t("clearFilters")}
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} service{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}

            <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={displayedServices.length > 0 && selectedIds.size === displayedServices.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <button
                    type="button"
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    {tCommon("name")}
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <button
                    type="button"
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("duration")}
                  >
                    {tCommon("duration")}
                    {getSortIcon("duration")}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <button
                    type="button"
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("price")}
                  >
                    {tCommon("price")}
                    {getSortIcon("price")}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium">{tCommon("status")}</TableHead>
                <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedServices.map((service, index) => (
                <TableRow
                  key={service.id}
                  className={`hover:bg-muted/50 transition-colors ${
                    selectedIds.has(service.id) ? "bg-primary/5" : ""
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                  data-state={selectedIds.has(service.id) ? "selected" : undefined}
                >
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedIds.has(service.id)}
                      onCheckedChange={() => toggleSelectOne(service.id)}
                      aria-label={`Select ${service.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: service.color || "#3B82F6" }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{service.name}</span>
                          {(service.promotionalBadge || service.customBadgeLabel) && (
                            <PromotionalBadge
                              badge={service.promotionalBadge}
                              customLabel={service.customBadgeLabel}
                              size="sm"
                            />
                          )}
                        </div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{service.duration} min</span>
                  </TableCell>
                  <TableCell>
                    {isDiscountActive(service) ? (
                      <ServicePriceDisplay service={service} size="sm" showCountdown={true} />
                    ) : (
                      <Badge variant="secondary" className="font-medium">
                        {service.currency} {Number(service.price).toLocaleString()}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleActive(service)}
                        disabled={togglingServiceId === service.id}
                        aria-label={service.isActive ? t("deactivate") : t("activate")}
                      />
                      <span className={cn(
                        "text-xs",
                        service.isActive ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {service.isActive ? t("active") : t("inactive")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => openEditPanel(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteService")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteConfirmation", { name: service.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => checkAppointmentsBeforeDelete(service.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingServiceId === service.id || isCheckingAppointments}
                            >
                              {(deletingServiceId === service.id || isCheckingAppointments) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {tCommon("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                {t("showing")} {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} {t("of")} {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadServices(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {tCommon("previous")}
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadServices(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  {tCommon("next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Service{selectedIds.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The following services will be permanently deleted:
              <ul className="mt-2 list-disc list-inside text-sm">
                {getSelectedServiceNames().slice(0, 5).map((name) => (
                  <li key={name}>{name}</li>
                ))}
                {selectedIds.size > 5 && (
                  <li>...and {selectedIds.size - 5} more</li>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete {selectedIds.size} Service{selectedIds.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Warning AlertDialog (for services with appointments) */}
      <AlertDialog open={!!deleteWarning} onOpenChange={(open) => !open && setDeleteWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t("deleteWarningTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWarningDescription", { count: deleteWarning?.appointmentCount || 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWarning && handleDelete(deleteWarning.serviceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteAnyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dirty State Warning AlertDialog */}
      <AlertDialog open={showDirtyWarning} onOpenChange={setShowDirtyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unsavedChanges")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsavedChangesDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepEditing")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDirtyWarning(false);
                closePanel();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("discardChanges")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backdrop overlay for panel on mobile */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleCloseAttempt}
        />
      )}

      {/* Create/Edit Service Slide-in Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-background border-l shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {editingService ? t("editService") : t("addService")}
              </h2>
              {isDirty && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                  {t("unsaved")}
                </Badge>
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleCloseAttempt}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("serviceName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={validationErrors.name ? "border-destructive" : ""}
                required
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("serviceDescription")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">{t("serviceDuration")}</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="480"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={validationErrors.duration ? "border-destructive" : ""}
                  required
                />
                {validationErrors.duration && (
                  <p className="text-sm text-destructive">{validationErrors.duration}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t("servicePrice")}</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={validationErrors.price ? "border-destructive" : ""}
                  required
                />
                {validationErrors.price && (
                  <p className="text-sm text-destructive">{validationErrors.price}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("serviceColor")}</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={color || "#3B82F6"}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                  />
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
                      color && !DEFAULT_COLORS.includes(color)
                        ? "border-foreground"
                        : "border-dashed border-muted-foreground"
                    }`}
                    style={{
                      backgroundColor:
                        color && !DEFAULT_COLORS.includes(color) ? color : "transparent",
                    }}
                  >
                    {(!color || DEFAULT_COLORS.includes(color)) && "+"}
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{t("discountSettings")}</Label>
              </div>

              <div className="space-y-4">
                {/* Discount Type */}
                <div className="space-y-2">
                  <Label>{t("discountType")}</Label>
                  <div className="flex gap-2">
                    {(["none", "percentage", "fixed"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDiscountType(type)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-md border transition-all",
                          discountType === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                        style={discountType === type && primaryColor ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor
                        } : undefined}
                      >
                        {type === "none" ? t("discountNone") : type === "percentage" ? t("discountPercentage") : t("discountFixed")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Value */}
                {discountType !== "none" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        {discountType === "percentage" ? t("discountPercentageLabel") : t("discountAmountLabel")}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        step="0.01"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === "percentage" ? "20" : "500"}
                        className={validationErrors.discountValue ? "border-destructive" : ""}
                      />
                      {validationErrors.discountValue && (
                        <p className="text-sm text-destructive">{validationErrors.discountValue}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Date Range */}
                {discountType !== "none" && (
                  <div className="space-y-2">
                    <Label>{t("discountPeriod")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !discountDateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {discountDateRange?.from ? (
                            discountDateRange.to ? (
                              <>
                                {format(discountDateRange.from, "dd MMM yyyy")} –{" "}
                                {format(discountDateRange.to, "dd MMM yyyy")}
                              </>
                            ) : (
                              format(discountDateRange.from, "dd MMM yyyy")
                            )
                          ) : (
                            <span>{t("selectDateRange")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                        style={primaryColor ? {
                          "--primary": primaryColor,
                          "--accent": `${primaryColor}20`,
                        } as React.CSSProperties : undefined}
                      >
                        <Calendar
                          mode="range"
                          defaultMonth={discountDateRange?.from}
                          selected={discountDateRange}
                          onSelect={setDiscountDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    {validationErrors.discountDates && (
                      <p className="text-sm text-destructive">{validationErrors.discountDates}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Promotional Badge Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{t("promotionalBadge")}</Label>
              </div>

              <div className="space-y-4">
                {/* Preset Badges */}
                <div className="space-y-2">
                  <Label>{t("presetBadge")}</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPromotionalBadge(null)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md border transition-all",
                        !promotionalBadge
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                      style={!promotionalBadge && primaryColor ? {
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor
                      } : undefined}
                    >
                      {t("discountNone")}
                    </button>
                    {(["SALE", "NEW", "POPULAR", "HOT"] as const).map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => {
                          setPromotionalBadge(badge);
                          setCustomBadgeLabel("");
                        }}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-md border transition-all",
                          promotionalBadge === badge
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        style={promotionalBadge === badge && primaryColor ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}15`
                        } : undefined}
                      >
                        <PromotionalBadge badge={badge} size="sm" animate={false} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Label */}
                <div className="space-y-2">
                  <Label htmlFor="customBadgeLabel">{t("customLabel")}</Label>
                  <Input
                    id="customBadgeLabel"
                    value={customBadgeLabel}
                    onChange={(e) => {
                      setCustomBadgeLabel(e.target.value);
                      if (e.target.value) setPromotionalBadge(null);
                    }}
                    placeholder={t("customLabelPlaceholder")}
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={handleCloseAttempt}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(validationErrors).length > 0}
              style={primaryColor ? { backgroundColor: primaryColor } : undefined}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
