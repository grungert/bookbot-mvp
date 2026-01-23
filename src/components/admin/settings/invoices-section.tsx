"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight, Calendar, Loader2, ExternalLink, CreditCard, RefreshCw, Download, CheckCircle, Clock, Building2, Mail, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  planTier: string;
  planDescription: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
  basePrice: number;
  chatbotPrice: number;
  extraCompaniesPrice: number;
  totalMonthlyPrice: number;
  currency: string;
  status: "PAID" | "PENDING";
  issueDate: string;
  paidAt: string | null;
  autoRenew: boolean;
  nextBillingDate: string | null;
  adminNotes?: string | null;
}

interface SubscriptionInfo {
  status: string;
  planTier: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  hasChatbot: boolean;
  extraCompanySlots: number;
}

interface UserInfo {
  name: string | null;
  email: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  iban: string;
  bic: string;
}

type DatePeriod = "7d" | "30d" | "90d" | "custom";
type InvoiceStatus = "PAID" | "PENDING";

interface InvoicesSectionProps {
  companySlug: string;
  primaryColor?: string;
}

export function InvoicesSection({ companySlug, primaryColor }: InvoicesSectionProps) {
  const t = useTranslations("admin.invoicesSection");
  const tInvoices = useTranslations("invoices");

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("90d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<InvoiceStatus>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (customDateFrom && customDateTo) {
      return {
        from: new Date(customDateFrom),
        to: new Date(customDateTo),
      };
    }
    return undefined;
  });

  const itemsPerPage = 5;

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const response = await fetch("/api/subscription/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setSubscription(data.subscription);
        setUserInfo(data.user);
        setBankDetails(data.bankDetails);
      }
    } catch (error) {
      console.error("Error loading subscription invoices:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleAutoRenew(enabled: boolean) {
    if (!subscription) return;

    setIsTogglingAutoRenew(true);
    try {
      const response = await fetch("/api/subscription/auto-renew", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local subscription state
        setSubscription({
          ...subscription,
          status: data.status,
          currentPeriodEnd: data.currentPeriodEnd,
        });
      }
    } catch (error) {
      console.error("Error toggling auto-renew:", error);
    } finally {
      setIsTogglingAutoRenew(false);
    }
  }

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Apply status filter
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

    // Sort by issue date descending
    filtered.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    return filtered;
  }, [invoices, statusFilters, datePeriod, customDateFrom, customDateTo]);

  // Calculate paid total for the period
  const paidTotalForPeriod = useMemo(() => {
    const paidInvoices = filteredInvoices.filter((inv) => inv.status === "PAID");
    const total = paidInvoices.reduce((sum, inv) => sum + inv.totalMonthlyPrice, 0);
    return { total, currency: "EUR", count: paidInvoices.length };
  }, [filteredInvoices]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilters, datePeriod, customDateFrom, customDateTo]);

  const handleInvoiceClick = useCallback((invoice: SubscriptionInvoice) => {
    setSelectedInvoice(invoice);
    setIsSheetOpen(true);
  }, []);

  const generatePDF = useCallback(async (invoice: SubscriptionInvoice) => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", pageWidth / 2, y, { align: "center" });
      y += 15;

      // Invoice number and status
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, y);
      doc.text(`Status: ${invoice.status}`, pageWidth - 20, y, { align: "right" });
      y += 10;

      // Dates
      doc.setFontSize(10);
      doc.text(`Issue Date: ${format(parseISO(invoice.issueDate), "MMMM d, yyyy")}`, 20, y);
      if (invoice.paidAt) {
        doc.text(`Paid Date: ${format(parseISO(invoice.paidAt), "MMMM d, yyyy")}`, pageWidth - 20, y, { align: "right" });
      }
      y += 15;

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 15;

      // Customer info
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.text(userInfo?.name || "Customer", 20, y);
      y += 5;
      doc.text(userInfo?.email || "", 20, y);
      y += 15;

      // Bank details (if pending)
      if (invoice.status === "PENDING" && bankDetails && bankDetails.iban) {
        doc.setFont("helvetica", "bold");
        doc.text("Payment Details:", pageWidth - 80, y - 27);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (bankDetails.bankName) {
          doc.text(`Bank: ${bankDetails.bankName}`, pageWidth - 80, y - 20);
        }
        if (bankDetails.accountName) {
          doc.text(`Account: ${bankDetails.accountName}`, pageWidth - 80, y - 15);
        }
        doc.text(`IBAN: ${bankDetails.iban}`, pageWidth - 80, y - 10);
        if (bankDetails.bic) {
          doc.text(`BIC: ${bankDetails.bic}`, pageWidth - 80, y - 5);
        }
        doc.setFontSize(11);
      }

      // Separator line
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y - 5, pageWidth - 40, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Description", 25, y + 2);
      doc.text("Amount", pageWidth - 25, y + 2, { align: "right" });
      y += 15;

      // Line items
      doc.setFont("helvetica", "normal");

      // Base price
      if (invoice.basePrice > 0) {
        const planName = invoice.planTier === "BUSINESS" ? "Business Plan" : "Pro Plan";
        doc.text(planName, 25, y);
        doc.text(`€${invoice.basePrice.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
        y += 8;
      }

      // Chatbot addon
      if (invoice.chatbotPrice > 0) {
        doc.text("AI Chatbot Addon", 25, y);
        doc.text(`€${invoice.chatbotPrice.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
        y += 8;
      }

      // Extra companies
      if (invoice.extraCompaniesPrice > 0) {
        doc.text(`Extra Companies (${invoice.extraCompanyCount})`, 25, y);
        doc.text(`€${invoice.extraCompaniesPrice.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
        y += 8;
      }

      y += 5;

      // Total line
      doc.setDrawColor(200, 200, 200);
      doc.line(pageWidth - 80, y, pageWidth - 20, y);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Total (Monthly):", pageWidth - 80, y);
      doc.text(`€${invoice.totalMonthlyPrice.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
      y += 20;

      // Footer
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text("This invoice is for your BookBot subscription.", 20, y);
      y += 5;
      if (invoice.autoRenew && invoice.nextBillingDate) {
        doc.text(`Next billing date: ${format(parseISO(invoice.nextBillingDate), "MMMM d, yyyy")}`, 20, y);
      }

      // Save the PDF
      doc.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [userInfo, bankDetails]);

  function getStatusBadge(status: InvoiceStatus) {
    if (status === "PAID") {
      return (
        <Badge variant="outline" className="font-medium text-xs bg-green-100 text-green-700 border-green-200">
          {t("statusPaid")}
        </Badge>
      );
    }

    if (primaryColor) {
      return (
        <Badge
          variant="outline"
          className="font-medium text-xs"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            borderColor: `${primaryColor}30`,
          }}
        >
          {t("statusPending")}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="font-medium text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
        {t("statusPending")}
      </Badge>
    );
  }

  function getPlanBadge(planTier: string) {
    const colors: Record<string, string> = {
      PRO: "bg-blue-100 text-blue-700 border-blue-200",
      BUSINESS: "bg-purple-100 text-purple-700 border-purple-200",
    };

    return (
      <Badge variant="outline" className={`font-medium text-xs ${colors[planTier] || "bg-gray-100 text-gray-700"}`}>
        {planTier}
      </Badge>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={primaryColor ? { backgroundColor: `${primaryColor}15` } : { backgroundColor: "hsl(var(--primary) / 0.1)" }}
          >
            <CreditCard
              className="h-4 w-4"
              style={primaryColor ? { color: primaryColor } : { color: "hsl(var(--primary))" }}
            />
          </div>
          <div>
            <h3 className="font-semibold">{t("title")}</h3>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
          {invoices.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {invoices.length}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t("noInvoices")}</p>
                  </div>
                ) : (
                  <>
                    {/* Subscription Status */}
                    {subscription && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mt-4">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{t("autoRenew")}</p>
                            <p className="text-xs text-muted-foreground">
                              {subscription.status === "ACTIVE"
                                ? t("nextBilling", { date: format(parseISO(subscription.currentPeriodEnd), "MMM d, yyyy") })
                                : t("autoRenewDisabled")}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={subscription.status === "ACTIVE"}
                          disabled={isTogglingAutoRenew}
                          onCheckedChange={(checked) => toggleAutoRenew(checked)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    )}

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                      {/* Date Period Filter */}
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
                              "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
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
                                "px-2.5 py-1 text-xs font-medium rounded-md transition-all inline-flex items-center gap-1",
                                datePeriod === "custom"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Calendar className="h-3 w-3" />
                              <span className="hidden sm:inline">
                                {datePeriod === "custom" && customDateFrom && customDateTo
                                  ? `${format(new Date(customDateFrom), "MMM d")} - ${format(new Date(customDateTo), "MMM d")}`
                                  : t("customRange")}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 border-b">
                              <p className="text-sm font-medium">{tInvoices("selectDateRange")}</p>
                            </div>
                            <div
                              className="[&_[data-selected-single=true]]:!bg-[var(--calendar-primary)] [&_[data-range-start=true]]:!bg-[var(--calendar-primary)] [&_[data-range-end=true]]:!bg-[var(--calendar-primary)]"
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
                              <div className="text-xs text-muted-foreground">
                                {dateRange?.from && (
                                  <span>
                                    {format(dateRange.from, "MMM d, yyyy")}
                                    {dateRange?.to && (
                                      <> - {format(dateRange.to, "MMM d, yyyy")}</>
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
                                {tInvoices("apply")}
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Status Filter Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {([
                          { value: "PENDING" as const, label: t("statusPending"), activeClass: "bg-yellow-700 text-white border-yellow-700", inactiveClass: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200" },
                          { value: "PAID" as const, label: t("statusPaid"), activeClass: "bg-green-700 text-white border-green-700", inactiveClass: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
                        ]).map((status) => {
                          const isActive = statusFilters.has(status.value);

                          return (
                            <Badge
                              key={status.value}
                              variant="outline"
                              className={cn(
                                "cursor-pointer transition-colors text-xs",
                                isActive ? status.activeClass : status.inactiveClass
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
                          );
                        })}
                      </div>
                    </div>

                    {/* Paid Total Summary */}
                    {paidTotalForPeriod.count > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                          <span className="text-green-700 text-xs font-semibold">€</span>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 font-medium">
                            {t("paidTotal")} ({paidTotalForPeriod.count})
                          </p>
                          <p className="text-sm font-bold text-green-800">
                            €{paidTotalForPeriod.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Invoices Table */}
                    {filteredInvoices.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">{t("noInvoices")}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs font-medium">{t("invoice")}</TableHead>
                              <TableHead className="text-xs font-medium">{t("plan")}</TableHead>
                              <TableHead className="text-xs font-medium">{t("issueDate")}</TableHead>
                              <TableHead className="text-xs font-medium text-right">{t("total")}</TableHead>
                              <TableHead className="text-xs font-medium">{t("status")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedInvoices.map((invoice) => (
                              <TableRow
                                key={invoice.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => handleInvoiceClick(invoice)}
                              >
                                <TableCell className="font-medium text-sm">
                                  {invoice.invoiceNumber}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {getPlanBadge(invoice.planTier)}
                                    <span className="text-xs text-muted-foreground">
                                      {invoice.includeChatbot && invoice.planTier === "PRO" && "+ Chatbot"}
                                      {invoice.extraCompanyCount > 0 && ` +${invoice.extraCompanyCount} co.`}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {format(parseISO(invoice.issueDate), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-medium text-sm">
                                      €{invoice.totalMonthlyPrice.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/month</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {tInvoices("showing")} {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredInvoices.length)} {tInvoices("of")} {filteredInvoices.length}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-7 w-7 p-0"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              if (page === 1 || page === totalPages) return true;
                              if (Math.abs(page - currentPage) <= 1) return true;
                              return false;
                            })
                            .map((page, idx, arr) => (
                              <span key={page} className="flex items-center">
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span className="px-1 text-muted-foreground text-xs">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="h-7 w-7 p-0 text-xs"
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
                            className="h-7 w-7 p-0"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* View All Link */}
                    <div className="pt-2 border-t">
                      <Link
                        href={`/c/${companySlug}/admin/invoices`}
                        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                        style={primaryColor ? { color: primaryColor } : undefined}
                      >
                        {t("viewAllServiceInvoices")}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
            </>
          )}
        </div>
      </div>

      {/* Invoice Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto px-6">
          {selectedInvoice && (
            <>
              <SheetHeader className="pr-6">
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedInvoice.invoiceNumber}
                </SheetTitle>
                <SheetDescription>
                  {t("invoiceDetails")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 pb-6">
                {/* Status Banner */}
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg",
                  selectedInvoice.status === "PAID" ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
                )}>
                  {selectedInvoice.status === "PAID" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className={cn(
                      "font-medium",
                      selectedInvoice.status === "PAID" ? "text-green-800" : "text-yellow-800"
                    )}>
                      {selectedInvoice.status === "PAID" ? t("invoicePaid") : t("invoicePending")}
                    </p>
                    {selectedInvoice.paidAt && (
                      <p className="text-sm text-green-600">
                        {t("paidOn", { date: format(parseISO(selectedInvoice.paidAt), "MMMM d, yyyy") })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                {userInfo && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{t("billedTo")}</h4>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{userInfo.name || t("customer")}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {userInfo.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{t("details")}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("issueDate")}</span>
                      <span className="text-sm font-medium">
                        {format(parseISO(selectedInvoice.issueDate), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("plan")}</span>
                      {getPlanBadge(selectedInvoice.planTier)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Line Items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{t("lineItems")}</h4>

                  {selectedInvoice.basePrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        {selectedInvoice.planTier === "BUSINESS" ? t("businessPlan") : t("proPlan")}
                      </span>
                      <span className="text-sm font-medium">€{selectedInvoice.basePrice.toFixed(2)}</span>
                    </div>
                  )}

                  {selectedInvoice.chatbotPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("chatbotAddon")}</span>
                      <span className="text-sm font-medium">€{selectedInvoice.chatbotPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {selectedInvoice.extraCompaniesPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("extraCompanies", { count: selectedInvoice.extraCompanyCount })}</span>
                      <span className="text-sm font-medium">€{selectedInvoice.extraCompaniesPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t("totalMonthly")}</span>
                    <span className="font-bold text-lg">€{selectedInvoice.totalMonthlyPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Bank Details (for pending invoices) */}
                {selectedInvoice.status === "PENDING" && bankDetails && bankDetails.iban && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">{t("paymentDetails")}</h4>
                      <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                        {bankDetails.bankName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("bankName")}</span>
                            <span className="font-medium">{bankDetails.bankName}</span>
                          </div>
                        )}
                        {bankDetails.accountName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("accountName")}</span>
                            <span className="font-medium">{bankDetails.accountName}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IBAN</span>
                          <span className="font-medium font-mono text-xs">{bankDetails.iban}</span>
                        </div>
                        {bankDetails.bic && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BIC/SWIFT</span>
                            <span className="font-medium">{bankDetails.bic}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Auto-Renew Info */}
                {selectedInvoice.autoRenew && selectedInvoice.nextBillingDate && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {t("nextBilling", { date: format(parseISO(selectedInvoice.nextBillingDate), "MMMM d, yyyy") })}
                    </p>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  className="w-full"
                  onClick={() => generatePDF(selectedInvoice)}
                  disabled={isDownloading}
                  style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {t("downloadPDF")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
