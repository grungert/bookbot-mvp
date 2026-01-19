"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Loader2, Trash2, FileText, ArrowUpDown, ArrowUp, ArrowDown, X, Calendar, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { calculateDiscountedPrice } from "@/lib/utils/discount";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  color: string | null;
  discountType: string | null;
  discountValue: number | null;
  discountStartDate: string | null;
  discountEndDate: string | null;
}

interface LineItem {
  id?: string;
  serviceId?: string; // null/undefined means custom item
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  // Discount fields
  originalUnitPrice?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  discountPercentage?: number | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate: string | null;
  appointmentDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  lineItems: LineItem[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

type DatePeriod = "7d" | "30d" | "90d" | "custom";

export default function InvoicesPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companyCurrency, setCompanyCurrency] = useState("RSD");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"invoiceNumber" | "customer" | "issueDate" | "total" | "status" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);

  // Filter state
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("7d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<Invoice["status"]>>(new Set());
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (customDateFrom && customDateTo) {
      return {
        from: new Date(customDateFrom),
        to: new Date(customDateTo),
      };
    }
    return undefined;
  });

  // Get primary color from CSS variable set by parent layout
  const [primaryColor, setPrimaryColor] = useState<string | undefined>(undefined);
  useEffect(() => {
    const el = document.querySelector("[style*='--company-primary']") as HTMLElement;
    if (el) {
      const color = getComputedStyle(el).getPropertyValue("--company-primary").trim();
      if (color) setPrimaryColor(color);
    }
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    loadInvoices();
    loadUsers();
    loadServices();
    loadCompanySettings();
  }, [companySlug]);

  async function loadCompanySettings() {
    try {
      const response = await fetch(`/api/c/${companySlug}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.currency) {
          setCompanyCurrency(data.currency);
        }
      }
    } catch (error) {
      // Silently fail - will use default currency
    }
  }

  // Body scroll lock when panel is open
  useEffect(() => {
    if (isViewPanelOpen || isFormPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isViewPanelOpen, isFormPanelOpen]);

  async function loadInvoices() {
    try {
      const response = await fetch(`/api/c/${companySlug}/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUsers() {
    // In a real app, you'd have a users API endpoint
    // For now, we'll use the appointments endpoint to get users
    try {
      const response = await fetch(`/api/c/${companySlug}/appointments`);
      if (response.ok) {
        const data = await response.json();
        const uniqueUsers = Array.from(
          new Map(data.map((apt: { user: User }) => [apt.user.id, apt.user])).values()
        ) as User[];
        setUsers(uniqueUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
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
      console.error("Error loading services:", error);
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  }

  function updateLineItem(index: number, updates: Partial<LineItem>) {
    setLineItems(
      lineItems.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function calculateTotal() {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || lineItems.some((item) => !item.description)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingInvoice) {
        // PATCH existing invoice
        const response = await fetch(`/api/c/${companySlug}/invoices/${editingInvoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes || undefined,
            lineItems: lineItems.map((item) => ({
              serviceId: item.serviceId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              originalUnitPrice: item.originalUnitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountPercentage: item.discountPercentage,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update invoice");
        }

        toast.success("Invoice updated");
      } else {
        // POST new invoice
        const response = await fetch(`/api/c/${companySlug}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes || undefined,
            lineItems: lineItems.map((item) => ({
              serviceId: item.serviceId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              originalUnitPrice: item.originalUnitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountPercentage: item.discountPercentage,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create invoice");
        }

        toast.success("Invoice created");
      }

      closeFormPanel();
      loadInvoices();
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedUserId("");
    setDueDate("");
    setNotes("");
    setLineItems([{ description: "", quantity: 1, unitPrice: 0 }]);
  }

  async function updateStatus(invoiceId: string, status: Invoice["status"]) {
    try {
      const response = await fetch(
        `/api/c/${companySlug}/invoices/${invoiceId}`,
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
      loadInvoices();
    } catch (error) {
      toast.error(tCommon("error"));
    }
  }

  function getStatusBadge(status: Invoice["status"]) {
    const baseStyles: Record<Invoice["status"], string> = {
      DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
      SENT: "", // Will be styled dynamically with primaryColor
      PAID: "bg-green-100 text-green-700 border-green-200",
      CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };

    const labels: Record<Invoice["status"], string> = {
      DRAFT: t("statusDraft"),
      SENT: t("statusSent"),
      PAID: t("statusPaid"),
      CANCELLED: t("statusCancelled"),
    };

    // For SENT status, use company primary color
    if (status === "SENT" && primaryColor) {
      return (
        <Badge
          variant="outline"
          className="font-medium"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            borderColor: `${primaryColor}30`,
          }}
        >
          {labels[status]}
        </Badge>
      );
    }

    // For SENT without primaryColor, use default primary
    if (status === "SENT") {
      return (
        <Badge variant="outline" className="font-medium bg-primary/10 text-primary border-primary/20">
          {labels[status]}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className={`font-medium ${baseStyles[status]}`}>
        {labels[status]}
      </Badge>
    );
  }

  // Filtering and sorting helper
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Apply status filter (multi-select)
    if (statusFilters.size > 0) {
      filtered = filtered.filter((inv) => statusFilters.has(inv.status));
    }

    // Apply date filter
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
      filtered = filtered.filter((inv) => {
        const invoiceDate = parseISO(inv.issueDate);
        return isWithinInterval(invoiceDate, { start: startDate!, end: endDate });
      });
    }

    // Apply sorting
    if (!sortColumn) return filtered;

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortColumn === "invoiceNumber") {
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
      } else if (sortColumn === "customer") {
        const nameA = a.user.name || a.user.email;
        const nameB = b.user.name || b.user.email;
        comparison = nameA.localeCompare(nameB);
      } else if (sortColumn === "issueDate") {
        comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
      } else if (sortColumn === "total") {
        comparison = Number(a.total) - Number(b.total);
      } else if (sortColumn === "status") {
        const statusOrder = { DRAFT: 0, SENT: 1, PAID: 2, CANCELLED: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [invoices, sortColumn, sortDirection, statusFilters, datePeriod, customDateFrom, customDateTo]);

  // Calculate total paid amount for the selected period
  const paidTotalForPeriod = useMemo(() => {
    // Get invoices filtered by date only (ignore status filter for this calculation)
    let dateFiltered = [...invoices];

    const now = new Date();
    let startDate: Date | null = null;
    let endDateVal: Date = endOfDay(now);

    if (datePeriod === "7d") {
      startDate = startOfDay(subDays(now, 7));
    } else if (datePeriod === "30d") {
      startDate = startOfDay(subDays(now, 30));
    } else if (datePeriod === "90d") {
      startDate = startOfDay(subDays(now, 90));
    } else if (datePeriod === "custom" && customDateFrom && customDateTo) {
      startDate = startOfDay(new Date(customDateFrom));
      endDateVal = endOfDay(new Date(customDateTo));
    }

    if (startDate) {
      dateFiltered = dateFiltered.filter((inv) => {
        const invoiceDate = parseISO(inv.issueDate);
        return isWithinInterval(invoiceDate, { start: startDate!, end: endDateVal });
      });
    }

    // Sum only PAID invoices
    const paidInvoices = dateFiltered.filter((inv) => inv.status === "PAID");
    const total = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const currency = paidInvoices[0]?.currency || companyCurrency;

    return { total, currency, count: paidInvoices.length };
  }, [invoices, datePeriod, customDateFrom, customDateTo, companyCurrency]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedInvoices, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilters, datePeriod, customDateFrom, customDateTo]);

  // Selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((inv) => inv.id)));
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
  function handleSort(column: "invoiceNumber" | "customer" | "issueDate" | "total" | "status") {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  // Get sort icon for column
  function getSortIcon(column: "invoiceNumber" | "customer" | "issueDate" | "total" | "status") {
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
        fetch(`/api/c/${companySlug}/invoices/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
      const failCount = selectedIds.size - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} invoice(s) deleted successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} invoice(s)`);
      }

      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      loadInvoices();
    } catch {
      toast.error("Failed to delete invoices. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // Get selected invoice numbers for confirmation
  function getSelectedInvoiceNumbers(): string[] {
    return invoices
      .filter((inv) => selectedIds.has(inv.id))
      .map((inv) => inv.invoiceNumber);
  }

  // Close view panel handler with delayed clearing
  function closePanel() {
    setIsViewPanelOpen(false);
    setTimeout(() => setViewingInvoice(null), 300);
  }

  // Form panel handlers
  function openCreatePanel() {
    resetForm();
    setEditingInvoice(null);
    setIsFormPanelOpen(true);
  }

  function openEditPanel(invoice: Invoice) {
    setEditingInvoice(invoice);
    setSelectedUserId(invoice.user.id);
    setDueDate(invoice.dueDate ? format(parseISO(invoice.dueDate), "yyyy-MM-dd") : "");
    setNotes(invoice.notes || "");
    setLineItems(invoice.lineItems.map(item => ({
      id: item.id,
      serviceId: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })));
    setIsFormPanelOpen(true);
  }

  function closeFormPanel() {
    setIsFormPanelOpen(false);
    setTimeout(() => {
      setEditingInvoice(null);
      resetForm();
    }, 300);
  }

  // Single invoice delete handlers
  function openDeleteDialog(invoice: Invoice) {
    setDeletingInvoice(invoice);
    setIsDeleteDialogOpen(true);
  }

  async function handleSingleDelete() {
    if (!deletingInvoice) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/c/${companySlug}/invoices/${deletingInvoice.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete invoice");
      }

      toast.success(`Invoice ${deletingInvoice.invoiceNumber} deleted`);
      setIsDeleteDialogOpen(false);
      setDeletingInvoice(null);

      // Close view panel if this invoice was being viewed
      if (viewingInvoice?.id === deletingInvoice.id) {
        closePanel();
      }

      loadInvoices();
    } catch (error) {
      toast.error("Failed to delete invoice");
    } finally {
      setIsDeleting(false);
    }
  }

  // Helper to open edit from view panel
  function openEditFromViewPanel() {
    if (!viewingInvoice) return;
    closePanel();
    setTimeout(() => {
      openEditPanel(viewingInvoice);
    }, 300);
  }

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
        <Button
          onClick={openCreatePanel}
          style={primaryColor ? { backgroundColor: primaryColor } : undefined}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createInvoice")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
        {/* Status Filter - Multi-select */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex items-center gap-1.5">
            {([
              { value: "DRAFT" as const, label: t("statusDraft"), activeClass: "bg-gray-700 text-white border-gray-700", inactiveClass: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200" },
              { value: "SENT" as const, label: t("statusSent"), activeClass: "", inactiveClass: "" }, // Will be styled with primaryColor
              { value: "PAID" as const, label: t("statusPaid"), activeClass: "bg-green-700 text-white border-green-700", inactiveClass: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
              { value: "CANCELLED" as const, label: t("statusCancelled"), activeClass: "bg-red-700 text-white border-red-700", inactiveClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
            ]).map((status) => {
              const isActive = statusFilters.has(status.value);
              const isSent = status.value === "SENT";

              // Special styling for SENT with company primaryColor
              const sentStyle = isSent && primaryColor
                ? isActive
                  ? { backgroundColor: primaryColor, color: "white", borderColor: primaryColor }
                  : { backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` }
                : undefined;

              const sentClass = isSent && !primaryColor
                ? isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                : "";

              return (
                <Badge
                  key={status.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    !isSent && (isActive ? status.activeClass : status.inactiveClass),
                    sentClass
                  )}
                  style={sentStyle}
                  onClick={() => {
                    const newFilters = new Set(statusFilters);
                    if (newFilters.has(status.value)) {
                      newFilters.delete(status.value);
                    } else {
                      newFilters.add(status.value);
                    }
                    setStatusFilters(newFilters);
                  }}
                >
                  {status.label}
                </Badge>
              );
            })}
            {statusFilters.size > 0 && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
                onClick={() => setStatusFilters(new Set())}
              >
                {t("clear")}
              </button>
            )}
          </div>
        </div>

        {/* Date Period Filter - Dashboard style */}
        <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
          {([
            { value: "7d", label: t("days7") },
            { value: "30d", label: t("days30") },
            { value: "90d", label: t("days90") },
          ] as const).map((period) => (
            <button
              key={period.value}
              onClick={() => setDatePeriod(period.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                datePeriod === period.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period.label}
            </button>
          ))}
          <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all inline-flex items-center gap-1.5",
                  datePeriod === "custom"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {datePeriod === "custom" && customDateFrom && customDateTo
                    ? `${format(new Date(customDateFrom), "MMM d")} - ${format(new Date(customDateTo), "MMM d")}`
                    : t("custom")}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">{t("selectDateRange")}</p>
              </div>
              <div
                className="[&_[data-selected-single=true]]:!bg-[var(--calendar-primary)] [&_[data-range-start=true]]:!bg-[var(--calendar-primary)] [&_[data-range-end=true]]:!bg-[var(--calendar-primary)] [&_.rdp-range_start]:!bg-[var(--calendar-primary)]/10 [&_.rdp-range_end]:!bg-[var(--calendar-primary)]/10"
                style={{ "--calendar-primary": primaryColor || "hsl(var(--primary))" } as React.CSSProperties}
              >
                <CalendarPicker
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) }}
                />
              </div>
              <div className="p-3 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {dateRange?.from && (
                    <span>
                      {t("from")}: {format(dateRange.from, "MMM d, yyyy")}
                      {dateRange?.to && (
                        <> → {t("to")}: {format(dateRange.to, "MMM d, yyyy")}</>
                      )}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (dateRange?.from && dateRange?.to) {
                      setCustomDateFrom(format(dateRange.from, "yyyy-MM-dd"));
                      setCustomDateTo(format(dateRange.to, "yyyy-MM-dd"));
                      setDatePeriod("custom");
                      setIsCustomDateOpen(false);
                    }
                  }}
                  disabled={!dateRange?.from || !dateRange?.to}
                  style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                  {t("apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Paid Total Summary */}
      {paidTotalForPeriod.count > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 animate-fade-up" style={{ animationDelay: "75ms" }}>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
            <span className="text-green-700 text-sm font-semibold">$</span>
          </div>
          <div>
            <p className="text-xs text-green-700 font-medium">
              {t("paidInPeriod")} ({paidTotalForPeriod.count} {paidTotalForPeriod.count !== 1 ? t("invoices") : t("invoice")})
            </p>
            <p className="text-lg font-bold text-green-800">
              {paidTotalForPeriod.currency} {paidTotalForPeriod.total.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Invoices Table Container */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {filteredAndSortedInvoices.length === invoices.length
              ? `${t("allInvoices")} (${invoices.length})`
              : `${t("filteredInvoices")} (${filteredAndSortedInvoices.length} ${t("of")} ${invoices.length})`}
          </h3>
          {statusFilters.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStatusFilters(new Set());
              }}
            >
              <X className="h-3 w-3 mr-1" />
              {t("clearStatusFilter")}
            </Button>
          )}
        </div>
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noInvoices")}</p>
            <Button
              onClick={openCreatePanel}
              variant="link"
              className="mt-2 text-primary"
            >
              {t("createInvoice")}
            </Button>
          </div>
        ) : filteredAndSortedInvoices.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noMatchingInvoices")}</p>
            <Button
              onClick={() => {
                setStatusFilters(new Set());
                setDatePeriod("7d");
                setCustomDateFrom("");
                setCustomDateTo("");
              }}
              variant="link"
              className="mt-2 text-primary"
            >
              {t("resetFilters")}
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} {selectedIds.size !== 1 ? t("invoices") : t("invoice")} {t("selected")}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("deleteSelected")}
                </Button>
              </div>
            )}

            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={invoices.length > 0 && selectedIds.size === invoices.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("invoiceNumber")}
                    >
                      {t("invoiceNumber")}
                      {getSortIcon("invoiceNumber")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("customer")}
                    >
                      {t("customer")}
                      {getSortIcon("customer")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("issueDate")}
                    >
                      {t("issueDate")}
                      {getSortIcon("issueDate")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t("appointmentDate")}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("total")}
                    >
                      {t("total")}
                      {getSortIcon("total")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      {tCommon("status")}
                      {getSortIcon("status")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-center">{t("statusActions")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice, index) => (
                  <TableRow
                    key={invoice.id}
                    className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                      selectedIds.has(invoice.id) ? "bg-primary/5" : ""
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    data-state={selectedIds.has(invoice.id) ? "selected" : undefined}
                    onClick={() => {
                      setViewingInvoice(invoice);
                      setIsViewPanelOpen(true);
                    }}
                  >
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={() => toggleSelectOne(invoice.id)}
                        aria-label={`Select ${invoice.invoiceNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{invoice.user.name || invoice.user.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{format(parseISO(invoice.issueDate), "MMM d, yyyy")}</span>
                    </TableCell>
                    <TableCell>
                      {invoice.appointmentDate ? (
                        <span className="text-sm">{format(parseISO(invoice.appointmentDate), "MMM d, yyyy HH:mm")}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{invoice.currency} {Number(invoice.total).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    {/* Status Actions Column */}
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {invoice.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => updateStatus(invoice.id, "SENT")}
                            style={primaryColor ? { borderColor: primaryColor, color: primaryColor } : undefined}
                          >
                            {t("send")}
                          </Button>
                        )}
                        {invoice.status === "SENT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                            onClick={() => updateStatus(invoice.id, "PAID")}
                          >
                            {t("markPaid")}
                          </Button>
                        )}
                        {(invoice.status === "PAID" || invoice.status === "CANCELLED") && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Edit/Delete Actions Column */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:text-primary"
                          disabled={invoice.status === "PAID" || invoice.status === "CANCELLED"}
                          onClick={() => openEditPanel(invoice)}
                          title={invoice.status === "PAID" || invoice.status === "CANCELLED" ? "Cannot edit finalized invoice" : "Edit invoice"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(invoice)}
                          title="Delete invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {t("showing")} {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedInvoices.length)} {t("of")} {filteredAndSortedInvoices.length}
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
          </>
        )}
      </div>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteInvoice")} ({selectedIds.size})</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmation")}
              <ul className="mt-2 list-disc list-inside text-sm">
                {getSelectedInvoiceNumbers().slice(0, 5).map((num) => (
                  <li key={num}>{num}</li>
                ))}
                {selectedIds.size > 5 && (
                  <li>...{t("andMore", { count: selectedIds.size - 5 })}</li>
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
              {tCommon("delete")} ({selectedIds.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Invoice Delete AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteInvoice")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSure")} <strong>{deletingInvoice?.invoiceNumber}</strong>?
              {t("cannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backdrop overlay for mobile */}
      {isViewPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closePanel}
        />
      )}

      {/* Invoice Side Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-background border-l shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isViewPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {viewingInvoice && (
          <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{viewingInvoice.invoiceNumber}</h2>
                {getStatusBadge(viewingInvoice.status)}
              </div>
              <Button variant="ghost" size="icon" onClick={closePanel}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Panel Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("customer")}
                  </h4>
                  <p className="font-medium">{viewingInvoice.user.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{viewingInvoice.user.email}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("dates")}
                  </h4>
                  {viewingInvoice.appointmentDate && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("appointmentDate")}:</span>{" "}
                      {format(parseISO(viewingInvoice.appointmentDate), "MMM d, yyyy HH:mm")}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("issued")}:</span>{" "}
                    {format(parseISO(viewingInvoice.issueDate), "MMM d, yyyy")}
                  </p>
                  {viewingInvoice.dueDate && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("due")}:</span>{" "}
                      {format(parseISO(viewingInvoice.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("lineItems")}
                </h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{t("description")}</TableHead>
                        <TableHead className="text-xs text-center w-20">{t("qty")}</TableHead>
                        <TableHead className="text-xs text-right w-28">{t("unitPrice")}</TableHead>
                        <TableHead className="text-xs text-right w-28">{t("total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingInvoice.lineItems.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{item.description}</span>
                              {item.discountPercentage && item.discountPercentage > 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0">
                                  -{item.discountPercentage}%
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.originalUnitPrice && Number(item.originalUnitPrice) > Number(item.unitPrice) ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-muted-foreground line-through">
                                  {viewingInvoice.currency} {Number(item.originalUnitPrice).toLocaleString()}
                                </span>
                                <span className="text-green-600 font-medium">
                                  {viewingInvoice.currency} {Number(item.unitPrice).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span>{viewingInvoice.currency} {Number(item.unitPrice).toLocaleString()}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {viewingInvoice.currency} {Number(item.total || item.quantity * item.unitPrice).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("subtotal")}</span>
                    <span>{viewingInvoice.currency} {Number(viewingInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("tax")}</span>
                    <span>{viewingInvoice.currency} {Number(viewingInvoice.tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>{t("total")}</span>
                    <span>{viewingInvoice.currency} {Number(viewingInvoice.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingInvoice.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("notes")}
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {viewingInvoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
              <div>
                {(viewingInvoice.status === "DRAFT" || viewingInvoice.status === "SENT") && (
                  <Button
                    variant="outline"
                    onClick={openEditFromViewPanel}
                    style={primaryColor ? { borderColor: primaryColor, color: primaryColor } : undefined}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t("edit")}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={closePanel}>
                  {t("close")}
                </Button>
                {viewingInvoice.status === "DRAFT" && (
                  <Button
                    onClick={() => {
                      updateStatus(viewingInvoice.id, "SENT");
                      closePanel();
                    }}
                    style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                  >
                    {t("sendInvoice")}
                  </Button>
                )}
                {viewingInvoice.status === "SENT" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      updateStatus(viewingInvoice.id, "PAID");
                      closePanel();
                    }}
                  >
                    {t("markAsPaid")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop overlay for form panel on mobile */}
      {isFormPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeFormPanel}
        />
      )}

      {/* Create/Edit Invoice Slide-in Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] lg:w-[560px] bg-background border-l shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isFormPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingInvoice ? t("editInvoice") : t("createInvoice")}
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={closeFormPanel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("customer")}</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("dueDate")}</Label>
                <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dueDate ? format(new Date(dueDate), "PPP") : t("selectDateRange")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <style>{`
                      .due-date-calendar button[data-selected-single="true"] {
                        background-color: ${primaryColor || "hsl(var(--primary))"} !important;
                      }
                    `}</style>
                    <CalendarPicker
                      mode="single"
                      selected={dueDate ? new Date(dueDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setDueDate(format(date, "yyyy-MM-dd"));
                        }
                        setIsDueDateOpen(false);
                      }}
                      className="due-date-calendar"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("lineItems")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  style={primaryColor ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("addLineItem")}
                </Button>
              </div>
              {lineItems.map((item, index) => (
                <div key={index} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Select
                        value={item.serviceId || "custom"}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            updateLineItem(index, {
                              serviceId: undefined,
                              description: "",
                              unitPrice: 0,
                              originalUnitPrice: undefined,
                              discountType: undefined,
                              discountValue: undefined,
                              discountPercentage: undefined,
                            });
                          } else {
                            const service = services.find((s) => s.id === value);
                            if (service) {
                              // Calculate discounted price if discount is active
                              const discountResult = calculateDiscountedPrice({
                                price: service.price,
                                currency: service.currency,
                                discountType: service.discountType as "percentage" | "fixed" | null,
                                discountValue: service.discountValue,
                                discountStartDate: service.discountStartDate,
                                discountEndDate: service.discountEndDate,
                              });

                              if (discountResult.isDiscounted) {
                                updateLineItem(index, {
                                  serviceId: service.id,
                                  description: service.name,
                                  unitPrice: discountResult.finalPrice,
                                  originalUnitPrice: discountResult.originalPrice,
                                  discountType: service.discountType,
                                  discountValue: service.discountValue,
                                  discountPercentage: discountResult.discountPercentage,
                                });
                              } else {
                                updateLineItem(index, {
                                  serviceId: service.id,
                                  description: service.name,
                                  unitPrice: service.price,
                                  originalUnitPrice: undefined,
                                  discountType: undefined,
                                  discountValue: undefined,
                                  discountPercentage: undefined,
                                });
                              }
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectServiceOrCustom")} />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => {
                            const discountResult = calculateDiscountedPrice({
                              price: service.price,
                              currency: service.currency,
                              discountType: service.discountType as "percentage" | "fixed" | null,
                              discountValue: service.discountValue,
                              discountStartDate: service.discountStartDate,
                              discountEndDate: service.discountEndDate,
                            });

                            return (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex items-center justify-between gap-4">
                                  <span>{service.name}</span>
                                  {discountResult.isDiscounted ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground text-xs line-through">
                                        {service.currency} {service.price.toLocaleString()}
                                      </span>
                                      <span className="text-green-600 text-xs font-medium">
                                        {service.currency} {discountResult.finalPrice.toLocaleString()}
                                      </span>
                                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1 py-0">
                                        -{discountResult.discountPercentage}%
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      {service.currency} {service.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                          <SelectItem value="custom">
                            <span className="text-muted-foreground">{t("customItem")}</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Show custom description input only for custom items */}
                  {!item.serviceId && (
                    <Input
                      placeholder={t("enterDescription")}
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(index, { description: e.target.value })
                      }
                    />
                  )}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{t("qty")}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, { quantity: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{t("unitPrice")}</Label>
                      {item.discountPercentage && item.originalUnitPrice ? (
                        <div className="h-9 px-3 py-1 text-sm bg-muted rounded-md flex flex-col justify-center">
                          <span className="text-[10px] text-muted-foreground line-through leading-none">
                            {item.originalUnitPrice.toLocaleString()}
                          </span>
                          <span className="text-green-600 font-medium leading-none">
                            {item.unitPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!!item.serviceId}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{t("total")}</Label>
                      <div className="h-9 px-3 py-2 text-sm font-medium bg-muted rounded-md">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {item.discountPercentage && item.discountPercentage > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0">
                        -{item.discountPercentage}% {t("discountApplied")}
                      </Badge>
                      <span>
                        {t("youSave", { amount: ((item.originalUnitPrice || 0) - item.unitPrice).toLocaleString() })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div className="text-right text-sm font-medium pt-2 border-t">
                {t("subtotal")}: {companyCurrency} {calculateTotal().toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Panel Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={closeFormPanel}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={primaryColor ? { backgroundColor: primaryColor } : undefined}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingInvoice ? t("saveChanges") : tCommon("create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
