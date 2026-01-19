"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  MessageSquare,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  serviceColor: string | null;
  serviceDuration: number;
  servicePrice: number;
  serviceCurrency: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  startTime: Date;
  createdAt: Date;
}

export interface RecentConversation {
  id: string;
  customerName: string;
  lastMessage: string;
  messageCount: number;
  isRead: boolean;
  createdAt: Date;
}

interface RecentActivityProps {
  bookings: RecentBooking[];
  conversations: RecentConversation[];
  companySlug: string;
  locale: string;
  primaryColor?: string;
  translations: {
    recentActivity: string;
    recentBookings: string;
    recentConversations: string;
    viewAll: string;
    noRecentBookings: string;
    noRecentConversations: string;
    messages: string;
    unread: string;
    loadMore: string;
    loading: string;
  };
  prefersReducedMotion?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Helper function to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const INITIAL_ITEMS = 5;
const LOAD_MORE_COUNT = 5;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
};

const dateGroupVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.15 },
  },
};

export function RecentActivity({
  bookings,
  conversations,
  companySlug,
  locale,
  primaryColor,
  translations,
  prefersReducedMotion = false,
}: RecentActivityProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "conversations">("bookings");
  const [visibleBookings, setVisibleBookings] = useState(INITIAL_ITEMS);
  const [visibleConversations, setVisibleConversations] = useState(INITIAL_ITEMS);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasActivity = bookings.length > 0 || conversations.length > 0;

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const visibleItems = bookings.slice(0, visibleBookings);
    const groups = new Map<string, RecentBooking[]>();

    visibleItems.forEach((booking) => {
      const dateKey = format(new Date(booking.startTime), "yyyy-MM-dd");
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, booking]);
    });

    return Array.from(groups.entries())
      .map(([date, items]) => ({
        date: parseISO(date + "T00:00:00"),
        bookings: items.sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bookings, visibleBookings]);

  if (!hasActivity) {
    return null;
  }

  const handleLoadMoreBookings = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleBookings((prev) => Math.min(prev + LOAD_MORE_COUNT, bookings.length));
      setLoadingMore(false);
    }, 300);
  };

  const handleLoadMoreConversations = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleConversations((prev) => Math.min(prev + LOAD_MORE_COUNT, conversations.length));
      setLoadingMore(false);
    }, 300);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border bg-card overflow-hidden"
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
          <span className="text-sm font-medium">{translations.recentActivity}</span>
          <div className="flex items-center gap-1.5 ml-2">
            {bookings.length > 0 && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                style={primaryColor ? { backgroundColor: primaryColor } : { backgroundColor: "#3B82F6" }}
              >
                <Calendar className="h-3 w-3" />
                {bookings.length}
              </motion.span>
            )}
            {conversations.length > 0 && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white"
              >
                <MessageSquare className="h-3 w-3" />
                {conversations.length}
              </motion.span>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {isExpanded ? "Click to collapse" : "Click to expand"}
        </span>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border-t overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("bookings")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors relative",
                  activeTab === "bookings"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={activeTab === "bookings" && primaryColor ? { color: primaryColor } : undefined}
              >
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {translations.recentBookings}
                  {bookings.length > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {bookings.length}
                    </span>
                  )}
                </div>
                {activeTab === "bookings" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("conversations")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors relative",
                  activeTab === "conversations"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={activeTab === "conversations" && primaryColor ? { color: primaryColor } : undefined}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {translations.recentConversations}
                  {conversations.length > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {conversations.length}
                    </span>
                  )}
                </div>
                {activeTab === "conversations" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            </div>

            {/* Tab Content - Scrollable */}
            <div className="px-4 pt-4 pb-2 max-h-[350px] overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === "bookings" && (
                  <motion.div
                    key="bookings"
                    variants={prefersReducedMotion ? undefined : tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5"
                  >
                    {bookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {translations.noRecentBookings}
                      </p>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {groupedBookings.map(({ date, bookings: dayBookings }, groupIndex) => (
                          <motion.div
                            key={date.toISOString()}
                            variants={prefersReducedMotion ? undefined : dateGroupVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: groupIndex * 0.1 }}
                            layout={!prefersReducedMotion}
                          >
                            {/* Date Header */}
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(date, "EEEE, MMMM d, yyyy")}
                            </h3>
                            {/* Booking Cards */}
                            <div className="flex flex-col gap-3">
                              <AnimatePresence mode="popLayout">
                                {dayBookings.map((booking, cardIndex) => (
                                  <motion.div
                                    key={booking.id}
                                    variants={prefersReducedMotion ? undefined : cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ delay: cardIndex * 0.05 }}
                                    layout={!prefersReducedMotion}
                                  >
                                    <BookingCard
                                      booking={booking}
                                      companySlug={companySlug}
                                      locale={locale}
                                    />
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}

                {activeTab === "conversations" && (
                  <motion.div
                    key="conversations"
                    variants={prefersReducedMotion ? undefined : tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-2"
                  >
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {translations.noRecentConversations}
                      </p>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {conversations.slice(0, visibleConversations).map((conversation, index) => (
                          <motion.div
                            key={conversation.id}
                            variants={prefersReducedMotion ? undefined : cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ delay: index * 0.05 }}
                            layout={!prefersReducedMotion}
                          >
                            <Link
                              href={`/${locale}/c/${companySlug}/admin/conversations?id=${conversation.id}`}
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                                  conversation.isRead
                                    ? "bg-muted text-muted-foreground"
                                    : "text-white"
                                )}
                                style={
                                  !conversation.isRead && primaryColor
                                    ? { backgroundColor: primaryColor }
                                    : !conversation.isRead
                                    ? { backgroundColor: "#3B82F6" }
                                    : undefined
                                }
                              >
                                {conversation.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "text-sm truncate",
                                      !conversation.isRead && "font-medium"
                                    )}
                                  >
                                    {conversation.customerName}
                                  </span>
                                  {!conversation.isRead && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-xs text-white"
                                      style={
                                        primaryColor
                                          ? { backgroundColor: primaryColor }
                                          : { backgroundColor: "#3B82F6" }
                                      }
                                    >
                                      {translations.unread}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="truncate">{conversation.lastMessage}</span>
                                  <span>·</span>
                                  <span>{conversation.messageCount} {translations.messages}</span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - Always Visible */}
            <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-center gap-4">
              {activeTab === "bookings" && visibleBookings < bookings.length && (
                <button
                  onClick={handleLoadMoreBookings}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-muted/50 transition-colors disabled:opacity-50"
                  style={primaryColor ? { color: primaryColor, borderColor: primaryColor } : undefined}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {translations.loading}
                    </>
                  ) : (
                    <>
                      {translations.loadMore}
                      <span className="text-xs opacity-70">
                        ({bookings.length - visibleBookings} more)
                      </span>
                    </>
                  )}
                </button>
              )}
              {activeTab === "conversations" && visibleConversations < conversations.length && (
                <button
                  onClick={handleLoadMoreConversations}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-muted/50 transition-colors disabled:opacity-50"
                  style={primaryColor ? { color: primaryColor, borderColor: primaryColor } : undefined}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {translations.loading}
                    </>
                  ) : (
                    <>
                      {translations.loadMore}
                      <span className="text-xs opacity-70">
                        ({conversations.length - visibleConversations} more)
                      </span>
                    </>
                  )}
                </button>
              )}
              <Link
                href={activeTab === "bookings"
                  ? `/${locale}/c/${companySlug}/admin/appointments`
                  : `/${locale}/c/${companySlug}/admin/conversations`
                }
                className="flex items-center gap-1 text-sm font-medium hover:underline"
                style={primaryColor ? { color: primaryColor } : undefined}
              >
                {translations.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BookingCard({
  booking,
  companySlug,
  locale,
}: {
  booking: RecentBooking;
  companySlug: string;
  locale: string;
}) {
  const startTime = new Date(booking.startTime);
  const serviceColor = booking.serviceColor || "#3B82F6";

  return (
    <Link href={`/${locale}/c/${companySlug}/admin/appointments?id=${booking.id}`}>
      <Card
        className={cn(
          "cursor-pointer group overflow-hidden py-0",
          "rounded-lg border bg-gradient-to-br to-transparent",
          "shadow-sm hover:shadow-md transition-shadow duration-200 hover:border-primary/20"
        )}
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${hexToRgba(serviceColor, 0.03)}, transparent)`
        }}
      >
        <CardContent className="py-2.5 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Service color bar */}
              <div
                className="w-1 h-10 rounded-full shrink-0"
                style={{ backgroundColor: serviceColor }}
              />

                {/* Time display */}
                <div
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[48px] rounded-md py-1.5 px-2",
                    "transition-all duration-300 group-hover:scale-105"
                  )}
                  style={{ backgroundColor: hexToRgba(serviceColor, 0.1) }}
                >
                  <span className="text-sm font-bold leading-tight">
                    {format(startTime, "h:mm")}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {format(startTime, "a")}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium transition-colors duration-200 group-hover:text-primary">
                      {booking.serviceName}
                    </h4>
                    <Badge
                      className={cn("text-[10px] px-1.5 py-0", statusColors[booking.status])}
                      variant="outline"
                    >
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{booking.serviceDuration} min</span>
                    {booking.servicePrice > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {booking.servicePrice.toLocaleString()} {booking.serviceCurrency}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
    </Link>
  );
}
