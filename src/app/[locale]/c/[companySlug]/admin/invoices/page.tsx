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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Loader2, Trash2, FileText, ArrowUpDown, ArrowUp, ArrowDown, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate: string | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"invoiceNumber" | "customer" | "issueDate" | "total" | "status" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);

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
  }, [companySlug]);

  // Body scroll lock when panel is open
  useEffect(() => {
    if (isViewPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isViewPanelOpen]);

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
      const response = await fetch(`/api/c/${companySlug}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes || undefined,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      toast.success("Invoice created");
      setIsDialogOpen(false);
      resetForm();
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
    const styles: Record<Invoice["status"], string> = {
      DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
      SENT: "bg-primary/10 text-primary border-primary/20",
      PAID: "bg-green-100 text-green-700 border-green-200",
      CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };

    const labels: Record<Invoice["status"], string> = {
      DRAFT: t("statusDraft"),
      SENT: t("statusSent"),
      PAID: t("statusPaid"),
      CANCELLED: t("statusCancelled"),
    };

    return (
      <Badge variant="outline" className={`font-medium ${styles[status]}`}>
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
    const currency = paidInvoices[0]?.currency || "RSD";

    return { total, currency, count: paidInvoices.length };
  }, [invoices, datePeriod, customDateFrom, customDateTo]);

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

  // Close panel handler with delayed clearing
  function closePanel() {
    setIsViewPanelOpen(false);
    setTimeout(() => setViewingInvoice(null), 300);
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
            Manage and track your invoices
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {t("createInvoice")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("createInvoice")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
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
                    <Label htmlFor="dueDate">{t("dueDate")}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("lineItems")}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-3 w-3 mr-1" />
                      {t("addLineItem")}
                    </Button>
                  </div>
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, { description: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, { quantity: parseInt(e.target.value) || 1 })
                        }
                        className="w-20"
                        placeholder="Qty"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="w-28"
                        placeholder="Price"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm text-muted-foreground">
                    Subtotal: RSD {calculateTotal().toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
        {/* Status Filter - Multi-select */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex items-center gap-1.5">
            {([
              { value: "DRAFT" as const, label: t("statusDraft"), activeClass: "bg-gray-700 text-white border-gray-700", inactiveClass: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200" },
              { value: "SENT" as const, label: t("statusSent"), activeClass: "bg-primary text-primary-foreground border-primary", inactiveClass: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" },
              { value: "PAID" as const, label: t("statusPaid"), activeClass: "bg-green-700 text-white border-green-700", inactiveClass: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
              { value: "CANCELLED" as const, label: t("statusCancelled"), activeClass: "bg-red-700 text-white border-red-700", inactiveClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
            ]).map((status) => (
              <Badge
                key={status.value}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors",
                  statusFilters.has(status.value)
                    ? status.activeClass
                    : status.inactiveClass
                )}
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
            ))}
            {statusFilters.size > 0 && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
                onClick={() => setStatusFilters(new Set())}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Date Period Filter - Dashboard style */}
        <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
          {([
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "90d", label: "90 Days" },
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
                    : "Custom"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">Select date range</p>
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
                      From: {format(dateRange.from, "MMM d, yyyy")}
                      {dateRange?.to && (
                        <> → To: {format(dateRange.to, "MMM d, yyyy")}</>
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
                  Apply
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
              Paid in selected period ({paidTotalForPeriod.count} invoice{paidTotalForPeriod.count !== 1 ? "s" : ""})
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
              ? `All Invoices (${invoices.length})`
              : `Filtered Invoices (${filteredAndSortedInvoices.length} of ${invoices.length})`}
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
              Clear status filter
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
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
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
            <p className="text-muted-foreground">No invoices match your filters</p>
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
              Reset filters
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} invoice{selectedIds.size !== 1 ? "s" : ""} selected
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
                      Customer
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
                      <span className="font-medium">{invoice.currency} {Number(invoice.total).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {invoice.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                            onClick={() => updateStatus(invoice.id, "SENT")}
                          >
                            Send
                          </Button>
                        )}
                        {invoice.status === "SENT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                            onClick={() => updateStatus(invoice.id, "PAID")}
                          >
                            Mark Paid
                          </Button>
                        )}
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
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedInvoices.length)} of {filteredAndSortedInvoices.length}
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
            <AlertDialogTitle>Delete {selectedIds.size} Invoice{selectedIds.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The following invoices will be permanently deleted:
              <ul className="mt-2 list-disc list-inside text-sm">
                {getSelectedInvoiceNumbers().slice(0, 5).map((num) => (
                  <li key={num}>{num}</li>
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
              Delete {selectedIds.size} Invoice{selectedIds.size !== 1 ? "s" : ""}
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
                    Customer
                  </h4>
                  <p className="font-medium">{viewingInvoice.user.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{viewingInvoice.user.email}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Dates
                  </h4>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Issued:</span>{" "}
                    {format(parseISO(viewingInvoice.issueDate), "MMM d, yyyy")}
                  </p>
                  {viewingInvoice.dueDate && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Due:</span>{" "}
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
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs text-center w-20">Qty</TableHead>
                        <TableHead className="text-xs text-right w-28">Unit Price</TableHead>
                        <TableHead className="text-xs text-right w-28">{t("total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingInvoice.lineItems.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {viewingInvoice.currency} {Number(item.unitPrice).toLocaleString()}
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
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{viewingInvoice.currency} {Number(viewingInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
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
                    Notes
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {viewingInvoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
              <Button variant="outline" onClick={closePanel}>
                Close
              </Button>
              {viewingInvoice.status === "DRAFT" && (
                <Button
                  onClick={() => {
                    updateStatus(viewingInvoice.id, "SENT");
                    closePanel();
                  }}
                >
                  Send Invoice
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
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
