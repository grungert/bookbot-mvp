"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PeriodSelector } from "@/components/admin/dashboard/period-selector";
import type { DashboardPeriod } from "@/lib/db/tenant";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import {
  Loader2,
  MessageSquare,
  MessageCircle,
  Users,
  UserCheck,
  User,
  Eye,
  Trash2,
  Star,
  StarOff,
  Mail,
  MailOpen,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminMessageRenderer } from "@/components/chat/admin-message-renderer";
import { StatsCard } from "@/components/admin/dashboard/stats-card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ChatUser {
  id: string;
  email: string;
  name: string | null;
}

interface ChatSession {
  id: string;
  userId: string | null;
  user: ChatUser | null;
  messageCount: number;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface SessionDetails {
  id: string;
  userId: string | null;
  user: ChatUser | null;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  messages: ChatMessage[];
}

interface Stats {
  totalSessions: number;
  totalMessages: number;
  guestSessions: number;
  authenticatedSessions: number;
  unreadSessions: number;
}

export default function ConversationsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const prefersReducedMotion = useReducedMotion();

  // URL search params for period filtering
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as DashboardPeriod | "custom") || "30d";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  // Get primary color from CSS variable set by parent layout
  const [primaryColor, setPrimaryColor] = useState<string | undefined>(undefined);
  useEffect(() => {
    // The variable is set on a parent div, so we need to find it by querying an element with the style
    const el = document.querySelector("[style*='--company-primary']") as HTMLElement;
    if (el) {
      const color = getComputedStyle(el).getPropertyValue("--company-primary").trim();
      if (color) setPrimaryColor(color);
    }
  }, []);

  // Data state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [userType, setUserType] = useState<"all" | "guest" | "authenticated">("all");
  const [searchEmail, setSearchEmail] = useState("");

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"createdAt" | "messageCount" | null>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Dialog state
  const [viewingSession, setViewingSession] = useState<SessionDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Delete state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (userType !== "all") queryParams.set("userType", userType);
      if (searchEmail) queryParams.set("search", searchEmail);

      // Compute dates from period when not custom
      let computedStartDate = startDate;
      let computedEndDate = endDate;

      if (period !== "custom") {
        const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[period] || 30;
        const start = new Date();
        start.setDate(start.getDate() - days);
        computedStartDate = start.toISOString().split("T")[0];
        computedEndDate = ""; // No end date for preset periods
      }

      if (computedStartDate) queryParams.set("startDate", computedStartDate);
      if (computedEndDate) queryParams.set("endDate", computedEndDate);

      const response = await fetch(
        `/api/c/${companySlug}/conversations?${queryParams.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        setStats(data.stats);
      } else {
        toast.error(tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, userType, period, startDate, endDate, searchEmail, tCommon]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // View conversation details
  async function handleViewConversation(sessionId: string) {
    setIsLoadingDetails(true);
    setIsViewDialogOpen(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/conversations/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setViewingSession(data);

        // Mark as read if not already
        if (!data.isRead) {
          await fetch(`/api/c/${companySlug}/conversations/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          });
          // Update local state
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, isRead: true } : s))
          );
        }
      } else {
        toast.error(tCommon("error"));
        setIsViewDialogOpen(false);
      }
    } catch {
      toast.error(tCommon("error"));
      setIsViewDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  // Toggle important
  async function handleToggleImportant(sessionId: string, isImportant: boolean) {
    try {
      const response = await fetch(`/api/c/${companySlug}/conversations/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isImportant: !isImportant }),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, isImportant: !isImportant } : s))
        );
        toast.success(!isImportant ? t("markedImportant") : t("unmarkedImportant"));
      } else {
        toast.error(tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    }
  }

  // Toggle read
  async function handleToggleRead(sessionId: string, isRead: boolean) {
    try {
      const response = await fetch(`/api/c/${companySlug}/conversations/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !isRead }),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, isRead: !isRead } : s))
        );
      } else {
        toast.error(tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    }
  }

  // Delete single session
  async function handleDelete(sessionId: string) {
    setDeletingSessionId(sessionId);

    try {
      const response = await fetch(`/api/c/${companySlug}/conversations/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t("conversationDeleted"));
        loadConversations();
      } else {
        toast.error(tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setDeletingSessionId(null);
    }
  }

  // Bulk mark as read
  async function handleBulkMarkRead() {
    setIsBulkUpdating(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/conversations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionIds: Array.from(selectedIds),
          isRead: true,
        }),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) => (selectedIds.has(s.id) ? { ...s, isRead: true } : s))
        );
        setSelectedIds(new Set());
        toast.success(t("markedAsRead"));
      } else {
        toast.error(tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsBulkUpdating(false);
    }
  }

  // Bulk delete
  async function handleBulkDelete() {
    setIsBulkDeleting(true);

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/c/${companySlug}/conversations/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok
      ).length;
      const failCount = selectedIds.size - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} ${t("conversationsDeleted")}`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} ${t("failedToDelete")}`);
      }

      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      loadConversations();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // Sorting
  const sortedSessions = useMemo(() => {
    if (!sortColumn) return sessions;

    return [...sessions].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortColumn === "messageCount") {
        comparison = a.messageCount - b.messageCount;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [sessions, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSessions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSessions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userType, searchEmail, period, startDate, endDate]);

  // Selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
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
  function handleSort(column: "createdAt" | "messageCount") {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  // Get sort icon
  function getSortIcon(column: "createdAt" | "messageCount") {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  }

  // Get user display name
  function getUserDisplay(session: ChatSession) {
    if (session.user) {
      return session.user.name || session.user.email;
    }
    return t("guest");
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          !prefersReducedMotion && "animate-fade-up"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <div>
          <h1 className="text-2xl font-bold">{t("conversations")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("conversationsSubtitle")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div
          className={cn(
            "rounded-xl border bg-card/80 backdrop-blur-sm p-4",
            !prefersReducedMotion && "animate-fade-up"
          )}
          style={!prefersReducedMotion ? { opacity: 0, animationDelay: "50ms" } : undefined}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title={t("totalSessions")}
              value={stats.totalSessions}
              icon={MessageSquare}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              animationIndex={0}
              prefersReducedMotion={prefersReducedMotion}
            />
            <StatsCard
              title={t("totalMessages")}
              value={stats.totalMessages}
              icon={MessageCircle}
              iconBg="bg-cyan-500/10"
              iconColor="text-cyan-500"
              animationIndex={1}
              prefersReducedMotion={prefersReducedMotion}
            />
            <StatsCard
              title={t("guestSessions")}
              value={stats.guestSessions}
              icon={User}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
              animationIndex={2}
              prefersReducedMotion={prefersReducedMotion}
            />
            <StatsCard
              title={t("authenticatedSessions")}
              value={stats.authenticatedSessions}
              icon={UserCheck}
              iconBg="bg-green-500/10"
              iconColor="text-green-500"
              animationIndex={3}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className={cn(
          "flex flex-col sm:flex-row gap-4",
          !prefersReducedMotion && "animate-fade-up"
        )}
        style={!prefersReducedMotion ? { opacity: 0, animationDelay: "100ms" } : undefined}
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchByEmail")}
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={userType} onValueChange={(v) => setUserType(v as typeof userType)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("filterByUserType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allUsers")}</SelectItem>
            <SelectItem value="guest">{t("guestOnly")}</SelectItem>
            <SelectItem value="authenticated">{t("authenticatedOnly")}</SelectItem>
          </SelectContent>
        </Select>
        <PeriodSelector
          currentPeriod={period}
          customStartDate={startDate}
          customEndDate={endDate}
          primaryColor={primaryColor}
          translations={{
            period7d: tDashboard("period7d"),
            period30d: tDashboard("period30d"),
            period90d: tDashboard("period90d"),
            period1y: tDashboard("period1y"),
            periodCustom: tDashboard("periodCustom"),
            selectDateRange: tDashboard("selectDateRange"),
            from: tDashboard("from"),
            to: tDashboard("to"),
            apply: tDashboard("apply"),
          }}
        />
      </div>

      {/* Table Container */}
      <div
        className={cn(
          "rounded-xl border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/10",
          !prefersReducedMotion && "animate-fade-up"
        )}
        style={!prefersReducedMotion ? { opacity: 0, animationDelay: "150ms" } : undefined}
      >
        {sessions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noConversations")}</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} {t("selected")}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkRead}
                    disabled={isBulkUpdating}
                  >
                    {isBulkUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MailOpen className="h-4 w-4 mr-2" />
                    )}
                    {t("bulkMarkRead")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsBulkDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tCommon("delete")}
                  </Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={sessions.length > 0 && selectedIds.size === sessions.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium">User</TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("messageCount")}
                    >
                      {t("messagesLabel")}
                      {getSortIcon("messageCount")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      {t("started")}
                      {getSortIcon("createdAt")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-right">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((session, index) => (
                  <TableRow
                    key={session.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      selectedIds.has(session.id) && "bg-primary/5"
                    )}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      ...((!session.isRead && primaryColor) ? { backgroundColor: `${primaryColor}10` } : {}),
                    }}
                    data-state={selectedIds.has(session.id) ? "selected" : undefined}
                  >
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedIds.has(session.id)}
                        onCheckedChange={() => toggleSelectOne(session.id)}
                        aria-label={`Select conversation`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!session.isRead && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: primaryColor || "#3B82F6" }}
                          />
                        )}
                        {session.isImportant && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div>
                          <p className={cn("font-medium", !session.isRead && "font-semibold")}>
                            {getUserDisplay(session)}
                          </p>
                          {session.user && (
                            <p className="text-xs text-muted-foreground">
                              {session.user.email}
                            </p>
                          )}
                        </div>
                        {!session.user && (
                          <Badge variant="secondary" className="ml-2">
                            {t("guest")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.messageCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(parseISO(session.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleViewConversation(session.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-yellow-100 hover:text-yellow-600"
                          onClick={() => handleToggleImportant(session.id, session.isImportant)}
                        >
                          {session.isImportant ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleRead(session.id, session.isRead)}
                        >
                          {session.isRead ? (
                            <MailOpen className="h-4 w-4" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
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
                              <AlertDialogTitle>{t("deleteConversation")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteConfirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(session.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deletingSessionId === session.id}
                              >
                                {deletingSessionId === session.id ? (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {t("showing")} {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, sortedSessions.length)} {t("of")} {sortedSessions.length}
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

      {/* View Conversation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {viewingSession && (
                <>
                  {t("conversationWith")}{" "}
                  {viewingSession.user
                    ? viewingSession.user.name || viewingSession.user.email
                    : t("guest")}
                </>
              )}
            </DialogTitle>
            {viewingSession && (
              <p className="text-sm text-muted-foreground">
                {format(parseISO(viewingSession.createdAt), "MMMM d, yyyy 'at' HH:mm")}
              </p>
            )}
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewingSession ? (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {viewingSession.messages.map((message, index) => (
                <AdminMessageRenderer
                  key={message.id}
                  message={{
                    role: message.role as "user" | "assistant",
                    content: message.content,
                  }}
                  nextMessage={
                    viewingSession.messages[index + 1]
                      ? {
                          role: viewingSession.messages[index + 1].role as "user" | "assistant",
                          content: viewingSession.messages[index + 1].content,
                        }
                      : undefined
                  }
                  timestamp={format(parseISO(message.createdAt), "HH:mm")}
                />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tCommon("delete")} {selectedIds.size} {t("conversationsLabel")}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {tCommon("delete")} {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
