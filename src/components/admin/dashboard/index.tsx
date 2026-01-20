"use client";

import Link from "next/link";
import { Calendar, Users, DollarSign, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { StatsCard } from "./stats-card";
import { PeriodSelector } from "./period-selector";
import { RevenueChart } from "./revenue-chart";
import { AppointmentsStatusChart } from "./appointments-status-chart";
import { ServicesChart } from "./services-chart";
import { AppointmentsTrendChart } from "./appointments-trend-chart";
import { ChatSessionsChart } from "./chat-sessions-chart";
import { ChatActivityChart } from "./chat-activity-chart";
import { TodaySummary } from "./today-summary";
import {
  RecentActivity,
  type RecentBooking,
  type RecentConversation,
} from "./recent-activity";
import { CustomerSegmentsChart } from "./customer-segments-chart";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/lib/db/tenant";

interface DashboardContentProps {
  stats: {
    totalAppointments: number;
    appointmentTrend: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalRevenue: number;
    revenueTrend: number;
    totalCustomers: number;
    totalChatSessions: number;
    chatSessionTrend: number;
    totalChatMessages: number;
    chatMessageTrend: number;
    guestChatSessions: number;
    authenticatedChatSessions: number;
    uniqueChatters: number;
    appointmentsByStatus: {
      PENDING: number;
      CONFIRMED: number;
      COMPLETED: number;
      CANCELLED: number;
    };
    appointmentsTrendData: Array<{ date: string; value: number }>;
    revenueTrendData: Array<{ date: string; value: number }>;
    serviceStats: Array<{
      id: string;
      name: string;
      color: string;
      count: number;
    }>;
    chatActivityTrendData: Array<{ date: string; sessions: number; messages: number }>;
  };
  todaySummary: {
    appointmentsToday: number;
    confirmedToday: number;
    pendingToday: number;
    completedToday: number;
    revenueToday: number;
    nextAppointment?: {
      time: string;
      serviceName: string;
      customerName: string;
    };
  };
  quickActionsData: {
    pendingAppointments: number;
    overdueInvoices: number;
    unreadConversations: number;
  };
  recentActivity: {
    bookings: RecentBooking[];
    conversations: RecentConversation[];
  };
  customerSegments: {
    new: number;
    active: number;
    loyal: number;
    vip: number;
    at_risk: number;
    churned: number;
  };
  companySlug: string;
  locale: string;
  period: DashboardPeriod | "custom";
  customStartDate?: string;
  customEndDate?: string;
  translations: {
    title: string;
    subtitle: string;
    totalAppointments: string;
    pendingAppointments: string;
    completedAppointments: string;
    totalRevenue: string;
    totalCustomers: string;
    revenueTrend: string;
    appointmentsByStatus: string;
    popularServices: string;
    appointmentsTrend: string;
    totalChatSessions: string;
    totalChatMessages: string;
    chatSessionsByType: string;
    chatActivityTrend: string;
    guestSessions: string;
    authenticatedSessions: string;
    sessions: string;
    messages: string;
    period7d: string;
    period30d: string;
    period90d: string;
    period1y: string;
    periodCustom: string;
    selectDateRange: string;
    from: string;
    to: string;
    apply: string;
    vsLastPeriod: string;
    noData: string;
    appointments: string;
    // Quick actions
    overdueInvoices: string;
    unreadConversations: string;
    // Today summary
    todaySummary: string;
    appointmentsToday: string;
    confirmed: string;
    pending: string;
    completed: string;
    revenueToday: string;
    nextAppointment: string;
    noAppointmentsToday: string;
    at: string;
    // Recent activity
    recentActivity: string;
    recentBookings: string;
    recentConversations: string;
    viewAll: string;
    noRecentBookings: string;
    noRecentConversations: string;
    unread: string;
    loadMore: string;
    loading: string;
  };
  statusLabels: {
    pending: string;
    confirmed: string;
    completed: string;
    cancelled: string;
  };
  segmentLabels: {
    title: string;
    new: string;
    active: string;
    loyal: string;
    vip: string;
    at_risk: string;
    churned: string;
  };
  currency?: string;
  primaryColor?: string;
}

export function DashboardContent({
  stats,
  todaySummary,
  quickActionsData,
  recentActivity,
  customerSegments,
  companySlug,
  locale,
  period,
  customStartDate,
  customEndDate,
  translations,
  statusLabels,
  segmentLabels,
  currency = "RSD",
  primaryColor,
}: DashboardContentProps) {
  const prefersReducedMotion = useReducedMotion();

  // Create animation key based on period for re-triggering animations
  const animationKey = `${period}-${customStartDate || ""}-${customEndDate || ""}`;

  // Main stats - organized in 2 rows
  const statsRow1 = [
    {
      title: translations.totalAppointments,
      value: stats.totalAppointments,
      icon: Calendar,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: stats.appointmentTrend,
    },
    {
      title: translations.totalRevenue,
      value: `${currency} ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      trend: stats.revenueTrend,
    },
    {
      title: translations.totalCustomers,
      value: stats.totalCustomers,
      icon: Users,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: translations.totalChatSessions,
      value: stats.totalChatSessions,
      icon: MessageSquare,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
      trend: stats.chatSessionTrend,
    },
  ];

  const statsRow2 = [
    {
      title: translations.pendingAppointments,
      value: stats.pendingAppointments,
      icon: Clock,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: translations.completedAppointments,
      value: stats.completedAppointments,
      icon: CheckCircle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: translations.totalChatMessages,
      value: stats.totalChatMessages,
      icon: MessageSquare,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
      trend: stats.chatMessageTrend,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
          !prefersReducedMotion && "animate-fade-up"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <div>
          <h1 className="text-2xl font-bold">{translations.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translations.subtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {quickActionsData.pendingAppointments > 0 && (
              <Link
                href={`/${locale}/c/${companySlug}/admin/appointments?status=PENDING`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{translations.pendingAppointments}</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                  {quickActionsData.pendingAppointments}
                </span>
              </Link>
            )}
            {quickActionsData.unreadConversations > 0 && (
              <Link
                href={`/${locale}/c/${companySlug}/admin/conversations?unread=true`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{translations.unreadConversations}</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                  {quickActionsData.unreadConversations}
                </span>
              </Link>
            )}
          </div>
          <PeriodSelector
            currentPeriod={period}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            primaryColor={primaryColor}
            translations={{
              period7d: translations.period7d,
              period30d: translations.period30d,
              period90d: translations.period90d,
              period1y: translations.period1y,
              periodCustom: translations.periodCustom,
              selectDateRange: translations.selectDateRange,
              from: translations.from,
              to: translations.to,
              apply: translations.apply,
            }}
          />
        </div>
      </div>

      {/* Today's Summary Strip */}
      <TodaySummary
        appointmentsToday={todaySummary.appointmentsToday}
        confirmedToday={todaySummary.confirmedToday}
        pendingToday={todaySummary.pendingToday}
        completedToday={todaySummary.completedToday}
        revenueToday={todaySummary.revenueToday}
        nextAppointment={todaySummary.nextAppointment}
        currency={currency}
        translations={{
          todaySummary: translations.todaySummary,
          appointmentsToday: translations.appointmentsToday,
          confirmed: translations.confirmed,
          pending: translations.pending,
          completed: translations.completed,
          revenueToday: translations.revenueToday,
          nextAppointment: translations.nextAppointment,
          noAppointmentsToday: translations.noAppointmentsToday,
          at: translations.at,
        }}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Recent Activity (Collapsible) */}
      <RecentActivity
        bookings={recentActivity.bookings}
        conversations={recentActivity.conversations}
        companySlug={companySlug}
        locale={locale}
        primaryColor={primaryColor}
        translations={{
          recentActivity: translations.recentActivity,
          recentBookings: translations.recentBookings,
          recentConversations: translations.recentConversations,
          viewAll: translations.viewAll,
          noRecentBookings: translations.noRecentBookings,
          noRecentConversations: translations.noRecentConversations,
          messages: translations.messages,
          unread: translations.unread,
          loadMore: translations.loadMore,
          loading: translations.loading,
        }}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Stats Grid - Row 1: Main Metrics */}
      <div
        key={`stats-row1-${animationKey}`}
        className={cn(
          "grid gap-4 grid-cols-2 lg:grid-cols-4",
          !prefersReducedMotion && "animate-fade-up stagger-2"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        {statsRow1.map((stat, index) => (
          <StatsCard
            key={`${stat.title}-${animationKey}`}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
            trend={stat.trend}
            trendLabel={stat.trend !== undefined ? translations.vsLastPeriod : undefined}
            animationIndex={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* Stats Grid - Row 2: Secondary Metrics */}
      <div
        key={`stats-row2-${animationKey}`}
        className={cn(
          "grid gap-4 grid-cols-3",
          !prefersReducedMotion && "animate-fade-up stagger-3"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        {statsRow2.map((stat, index) => (
          <StatsCard
            key={`${stat.title}-${animationKey}`}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
            trend={stat.trend}
            trendLabel={stat.trend !== undefined ? translations.vsLastPeriod : undefined}
            animationIndex={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div
        key={`charts-row1-${animationKey}`}
        className={cn(
          "grid gap-4 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-4"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <RevenueChart
          data={stats.revenueTrendData}
          title={translations.revenueTrend}
          noDataMessage={translations.noData}
          currency={currency}
          prefersReducedMotion={prefersReducedMotion}
          primaryColor={primaryColor}
        />
        <AppointmentsStatusChart
          data={stats.appointmentsByStatus}
          title={translations.appointmentsByStatus}
          noDataMessage={translations.noData}
          labels={statusLabels}
          companySlug={companySlug}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Charts Row 2 */}
      <div
        key={`charts-row2-${animationKey}`}
        className={cn(
          "grid gap-4 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-5"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <ServicesChart
          data={stats.serviceStats}
          title={translations.popularServices}
          noDataMessage={translations.noData}
          appointmentsLabel={translations.appointments}
          companySlug={companySlug}
          prefersReducedMotion={prefersReducedMotion}
        />
        <AppointmentsTrendChart
          data={stats.appointmentsTrendData}
          title={translations.appointmentsTrend}
          noDataMessage={translations.noData}
          appointmentsLabel={translations.appointments}
          primaryColor={primaryColor}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Charts Row 3 - Chat Statistics */}
      <div
        key={`charts-row3-${animationKey}`}
        className={cn(
          "grid gap-4 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-6"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <ChatSessionsChart
          data={{
            guest: stats.guestChatSessions,
            authenticated: stats.authenticatedChatSessions,
          }}
          title={translations.chatSessionsByType}
          noDataMessage={translations.noData}
          labels={{
            guest: translations.guestSessions,
            authenticated: translations.authenticatedSessions,
          }}
          prefersReducedMotion={prefersReducedMotion}
        />
        <ChatActivityChart
          data={stats.chatActivityTrendData}
          title={translations.chatActivityTrend}
          noDataMessage={translations.noData}
          sessionsLabel={translations.sessions}
          messagesLabel={translations.messages}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Charts Row 4 - Customer Segments */}
      <div
        key={`charts-row4-${animationKey}`}
        className={cn(
          "grid gap-4 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-7"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <CustomerSegmentsChart
          data={customerSegments}
          title={segmentLabels.title}
          noDataMessage={translations.noData}
          labels={{
            new: segmentLabels.new,
            active: segmentLabels.active,
            loyal: segmentLabels.loyal,
            vip: segmentLabels.vip,
            at_risk: segmentLabels.at_risk,
            churned: segmentLabels.churned,
          }}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </div>
  );
}
