"use client";

import { Calendar, Users, DollarSign, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { StatsCard } from "./stats-card";
import { PeriodSelector } from "./period-selector";
import { RevenueChart } from "./revenue-chart";
import { AppointmentsStatusChart } from "./appointments-status-chart";
import { ServicesChart } from "./services-chart";
import { AppointmentsTrendChart } from "./appointments-trend-chart";
import { ChatSessionsChart } from "./chat-sessions-chart";
import { ChatActivityChart } from "./chat-activity-chart";
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
  };
  statusLabels: {
    pending: string;
    confirmed: string;
    completed: string;
    cancelled: string;
  };
  currency?: string;
  primaryColor?: string;
}

export function DashboardContent({
  stats,
  period,
  customStartDate,
  customEndDate,
  translations,
  statusLabels,
  currency = "RSD",
  primaryColor,
}: DashboardContentProps) {
  const prefersReducedMotion = useReducedMotion();

  // Create animation key based on period for re-triggering animations
  const animationKey = `${period}-${customStartDate || ""}-${customEndDate || ""}`;

  const statCards = [
    {
      title: translations.totalAppointments,
      value: stats.totalAppointments,
      icon: Calendar,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: stats.appointmentTrend,
    },
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
          <h1 className="text-2xl font-bold">{translations.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translations.subtitle}
          </p>
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

      {/* Stats Grid - Key triggers re-animation on period change */}
      <div
        key={`stats-${animationKey}`}
        className={cn(
          "rounded-xl border bg-card p-4",
          !prefersReducedMotion && "animate-fade-up stagger-1"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {statCards.map((stat, index) => (
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
      </div>

      {/* Charts Row 1 - Key triggers re-animation on period change */}
      <div
        key={`charts-row1-${animationKey}`}
        className={cn(
          "grid gap-6 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-3"
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
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Charts Row 2 */}
      <div
        key={`charts-row2-${animationKey}`}
        className={cn(
          "grid gap-6 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-4"
        )}
        style={!prefersReducedMotion ? { opacity: 0 } : undefined}
      >
        <ServicesChart
          data={stats.serviceStats}
          title={translations.popularServices}
          noDataMessage={translations.noData}
          appointmentsLabel={translations.appointments}
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
          "grid gap-6 lg:grid-cols-2",
          !prefersReducedMotion && "animate-fade-up stagger-5"
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
    </div>
  );
}
