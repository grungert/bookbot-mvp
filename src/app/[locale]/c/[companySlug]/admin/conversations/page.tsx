"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  LayoutList,
  X,
  RefreshCw,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminMessageRenderer } from "@/components/chat/admin-message-renderer";
import { StatsCard } from "@/components/admin/dashboard/stats-card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ChatUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
}

interface ChatSession {
  id: string;
  userId: string | null;
  user: ChatUser | null;
  channel: string;
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
  pagination?: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
  };
}

interface UserGroup {
  userId: string | null;
  user: ChatUser | null;
  sessionCount: number;
  totalMessages: number;
  lastActivity: string;
  unreadCount: number;
  sessions: Array<{
    id: string;
    channel: string;
    messageCount: number;
    isRead: boolean;
    isImportant: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface Stats {
  totalSessions: number;
  totalMessages: number;
  guestSessions: number;
  authenticatedSessions: number;
  unreadSessions: number;
  whatsappSessions: number;
}

export default function ConversationsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const prefersReducedMotion = useReducedMotion();

  // URL search params for period filtering and deep-linking
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as DashboardPeriod | "custom") || "30d";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const conversationId = searchParams.get("id"); // For deep-linking from dashboard

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
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state
  const [userType, setUserType] = useState<"all" | "guest" | "authenticated">("all");
  const [channel, setChannel] = useState<"all" | "web" | "whatsapp">("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [viewMode, setViewMode] = useState<"session" | "user">("session");
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string | null>>(new Set());

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"createdAt" | "messageCount" | null>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Dialog state
  const [viewingSession, setViewingSession] = useState<SessionDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Lazy loading state for messages
  const [dialogMessages, setDialogMessages] = useState<ChatMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastOpenedDeepLinkId = useRef<string | null>(null); // Track last opened conversation from URL

  // Delete state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isViewDialogOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isViewDialogOpen]);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (userType !== "all") queryParams.set("userType", userType);
      if (channel !== "all") queryParams.set("channel", channel);
      if (searchEmail) queryParams.set("search", searchEmail);
      queryParams.set("groupBy", viewMode);

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
        if (data.groupBy === "user") {
          setUserGroups(data.users);
          setSessions([]);
        } else {
          setSessions(data.sessions);
          setUserGroups([]);
        }
        setStats(data.stats);
      } else {
        toast.error(tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, userType, channel, period, startDate, endDate, searchEmail, viewMode, tCommon]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-open conversation from URL parameter (deep-linking from dashboard)
  useEffect(() => {
    if (conversationId && !isLoading && lastOpenedDeepLinkId.current !== conversationId) {
      lastOpenedDeepLinkId.current = conversationId;
      handleViewConversation(conversationId);
    }
    // Only run when conversationId changes or initial load completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isLoading]);

  // View conversation details
  async function handleViewConversation(sessionId: string) {
    setIsLoadingDetails(true);
    setIsViewDialogOpen(true);
    setDialogMessages([]);
    setHasMoreMessages(false);
    setNextCursor(null);
    setTotalMessageCount(0);

    try {
      const response = await fetch(`/api/c/${companySlug}/conversations/${sessionId}?limit=30`);
      if (response.ok) {
        const data = await response.json();
        setViewingSession(data);
        setDialogMessages(data.messages);
        if (data.pagination) {
          setHasMoreMessages(data.pagination.hasMore);
          setNextCursor(data.pagination.nextCursor);
          setTotalMessageCount(data.pagination.totalCount);
        }

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

        // Scroll to bottom after loading
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        }, 100);
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

  // Load more (earlier) messages
  async function loadMoreMessages() {
    if (!viewingSession || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    const scrollContainer = scrollContainerRef.current;
    const previousScrollHeight = scrollContainer?.scrollHeight || 0;

    try {
      const response = await fetch(
        `/api/c/${companySlug}/conversations/${viewingSession.id}?limit=30&cursor=${nextCursor}`
      );
      if (response.ok) {
        const data = await response.json();
        // Prepend older messages
        setDialogMessages((prev) => [...data.messages, ...prev]);
        if (data.pagination) {
          setHasMoreMessages(data.pagination.hasMore);
          setNextCursor(data.pagination.nextCursor);
        }

        // Preserve scroll position
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Toggle user expansion
  function toggleUserExpanded(userId: string | null) {
    setExpandedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
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
    setExpandedUserIds(new Set());
  }, [userType, channel, searchEmail, period, startDate, endDate, viewMode]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadConversations();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className={cn(
        "flex-1 min-w-0 space-y-6 transition-all duration-300",
        isViewDialogOpen && "lg:pr-0"
      )}>
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
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <StatsCard
              title={t("whatsappSessions")}
              value={stats.whatsappSessions}
              icon={Globe}
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-500"
              animationIndex={4}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4",
          !prefersReducedMotion && "animate-fade-up"
        )}
        style={!prefersReducedMotion ? { opacity: 0, animationDelay: "100ms" } : undefined}
      >
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchByEmail")}
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={userType} onValueChange={(v) => setUserType(v as typeof userType)}>
          <SelectTrigger className="w-full sm:w-[120px] bg-white">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("filterByUserType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allUsers")}</SelectItem>
            <SelectItem value="guest">{t("guestOnly")}</SelectItem>
            <SelectItem value="authenticated">{t("authenticatedOnly")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
          <SelectTrigger className="w-full sm:w-[140px] bg-white">
            <Globe className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("filterByChannel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("channelAll")}</SelectItem>
            <SelectItem value="web">{t("channelWeb")}</SelectItem>
            <SelectItem value="whatsapp">{t("channelWhatsapp")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <SelectTrigger className="w-full sm:w-[140px] bg-white">
            <LayoutList className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("viewMode")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="session">{t("bySession")}</SelectItem>
            <SelectItem value="user">{t("byUser")}</SelectItem>
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
        {(viewMode === "session" ? sessions.length === 0 : userGroups.length === 0) ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noConversations")}</p>
          </div>
        ) : viewMode === "user" ? (
          /* User View Mode */
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-xs font-medium">User</TableHead>
                <TableHead className="text-xs font-medium">{t("sessionsCount")}</TableHead>
                <TableHead className="text-xs font-medium">{t("messagesLabel")}</TableHead>
                <TableHead className="text-xs font-medium">{t("unread")}</TableHead>
                <TableHead className="text-xs font-medium">{t("started")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userGroups.map((group) => (
                <Fragment key={group.userId ?? "guests"}>
                  {/* User Row */}
                  <TableRow
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleUserExpanded(group.userId)}
                  >
                    <TableCell className="w-12">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {expandedUserIds.has(group.userId) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {group.user?.image ? (
                            <AvatarImage src={group.user.image} alt={group.user.name || group.user.email} />
                          ) : null}
                          <AvatarFallback
                            className={cn(
                              "text-xs font-medium",
                              group.unreadCount === 0
                                ? "bg-muted text-muted-foreground"
                                : "text-white"
                            )}
                            style={
                              group.unreadCount > 0 && primaryColor
                                ? { backgroundColor: primaryColor }
                                : group.unreadCount > 0
                                ? { backgroundColor: "#3B82F6" }
                                : undefined
                            }
                          >
                            {(group.user?.name || group.user?.email || "G").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          {group.unreadCount > 0 && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: primaryColor || "#3B82F6" }}
                            />
                          )}
                          <div>
                            <p className={cn("font-medium", group.unreadCount > 0 && "font-semibold")}>
                              {group.user ? group.user.name || group.user.email : t("guestSessions")}
                            </p>
                            {group.user && (
                              <p className="text-xs text-muted-foreground">{group.user.email}</p>
                            )}
                          </div>
                          {!group.user && (
                            <Badge variant="secondary" className="ml-2">{t("guest")}</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.sessionCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.totalMessages}</Badge>
                    </TableCell>
                    <TableCell>
                      {group.unreadCount > 0 && (
                        <Badge variant="secondary">{group.unreadCount}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(parseISO(group.lastActivity), "MMM d, yyyy HH:mm")}
                      </span>
                    </TableCell>
                  </TableRow>
                  {/* Expanded Sessions */}
                  {expandedUserIds.has(group.userId) && group.sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className={cn(
                        "bg-muted/30 hover:bg-muted/50",
                        !session.isRead && primaryColor ? `bg-[${primaryColor}10]` : ""
                      )}
                      style={!session.isRead && primaryColor ? { backgroundColor: `${primaryColor}10` } : undefined}
                    >
                      <TableCell className="w-12"></TableCell>
                      <TableCell className="pl-10">
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
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(session.createdAt), "MMM d, HH:mm")}
                          </span>
                          {session.channel === "whatsapp" ? (
                            <Badge variant="outline" className="border-green-500/50 text-green-600 text-xs">
                              {t("channelWhatsapp")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {t("channelWeb")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.messageCount}</Badge>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewConversation(session.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
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
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      selectedIds.has(session.id) && "bg-primary/5"
                    )}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      ...((!session.isRead && primaryColor) ? { backgroundColor: `${primaryColor}10` } : {}),
                    }}
                    data-state={selectedIds.has(session.id) ? "selected" : undefined}
                    onClick={() => handleViewConversation(session.id)}
                  >
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(session.id)}
                        onCheckedChange={() => toggleSelectOne(session.id)}
                        aria-label={`Select conversation`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {session.user?.image ? (
                            <AvatarImage src={session.user.image} alt={session.user.name || session.user.email} />
                          ) : null}
                          <AvatarFallback
                            className={cn(
                              "text-xs font-medium",
                              session.isRead
                                ? "bg-muted text-muted-foreground"
                                : "text-white"
                            )}
                            style={
                              !session.isRead && primaryColor
                                ? { backgroundColor: primaryColor }
                                : !session.isRead
                                ? { backgroundColor: "#3B82F6" }
                                : undefined
                            }
                          >
                            {(session.user?.name || session.user?.email || "G").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
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
                          {session.channel === "whatsapp" ? (
                            <Badge variant="outline" className="ml-2 border-green-500/50 text-green-600">
                              {t("channelWhatsapp")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="ml-2">
                              {t("channelWeb")}
                            </Badge>
                          )}
                        </div>
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
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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

      {/* Conversation Side Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-background border-l shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isViewDialogOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Panel Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {viewingSession && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {viewingSession.user?.image ? (
                      <AvatarImage src={viewingSession.user.image} alt={viewingSession.user.name || viewingSession.user.email} />
                    ) : null}
                    <AvatarFallback
                      className="text-sm font-medium text-white"
                      style={primaryColor ? { backgroundColor: primaryColor } : { backgroundColor: "#3B82F6" }}
                    >
                      {(viewingSession.user?.name || viewingSession.user?.email || "G").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate">
                      {t("conversationWith")}{" "}
                      {viewingSession.user
                        ? viewingSession.user.name || viewingSession.user.email
                        : t("guest")}
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(viewingSession.createdAt), "MMM d, yyyy 'at' HH:mm")}
                      </p>
                      {totalMessageCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t("showingMessages", { shown: dialogMessages.length, total: totalMessageCount })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsViewDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewingSession ? (
          <div
            ref={scrollContainerRef}
            className="h-[calc(100vh-80px)] overflow-y-auto px-6 py-4 space-y-4"
          >
            {/* Load Earlier Messages Button */}
            {hasMoreMessages && (
              <div className="flex justify-center pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronUp className="h-4 w-4 mr-2" />
                  )}
                  {t("loadEarlierMessages")}
                </Button>
              </div>
            )}
            {dialogMessages.map((message, index) => (
              <AdminMessageRenderer
                key={message.id}
                message={{
                  role: message.role as "user" | "assistant",
                  content: message.content,
                }}
                nextMessage={
                  dialogMessages[index + 1]
                    ? {
                        role: dialogMessages[index + 1].role as "user" | "assistant",
                        content: dialogMessages[index + 1].content,
                      }
                    : undefined
                }
                timestamp={format(parseISO(message.createdAt), "HH:mm")}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Backdrop overlay for mobile */}
      {isViewDialogOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsViewDialogOpen(false)}
        />
      )}
    </div>
  );
}
