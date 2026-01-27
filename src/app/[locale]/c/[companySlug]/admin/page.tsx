import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  getCompanyBySlug,
  getCompanyDashboardStats,
  getTodaySummary,
  getUnreadConversationsCount,
  getOverdueInvoicesCount,
  getRecentBookings,
  getRecentConversations,
  type DashboardPeriod,
} from "@/lib/db/tenant";
import { getCustomerSegmentStats } from "@/lib/db/customer-metrics";
import { DashboardContent } from "@/components/admin/dashboard";

interface AdminDashboardProps {
  params: Promise<{ locale: string; companySlug: string }>;
  searchParams: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}

export default async function AdminDashboard({ params, searchParams }: AdminDashboardProps) {
  const { locale, companySlug } = await params;
  const { period: periodParam, startDate, endDate } = await searchParams;
  setRequestLocale(locale);

  const company = await getCompanyBySlug(companySlug);
  if (!company) return null;

  // Validate period param
  const validPeriods: DashboardPeriod[] = ["7d", "30d", "90d", "1y"];
  const isCustomPeriod = periodParam === "custom" && startDate && endDate;
  const period: DashboardPeriod | "custom" = isCustomPeriod
    ? "custom"
    : validPeriods.includes(periodParam as DashboardPeriod)
      ? (periodParam as DashboardPeriod)
      : "30d";

  // Get stats with custom dates if provided
  const [stats, todaySummary, unreadConversations, overdueInvoices, recentBookings, recentConversations, customerSegments] =
    await Promise.all([
      getCompanyDashboardStats(
        company.id,
        isCustomPeriod ? "30d" : (period as DashboardPeriod),
        isCustomPeriod ? startDate : undefined,
        isCustomPeriod ? endDate : undefined
      ),
      getTodaySummary(company.id),
      getUnreadConversationsCount(company.id),
      getOverdueInvoicesCount(company.id),
      getRecentBookings(company.id, 20),
      getRecentConversations(company.id, 20),
      getCustomerSegmentStats(company.id),
    ]);

  const t = await getTranslations("dashboard");
  const tAppointments = await getTranslations("appointments");

  return (
    <DashboardContent
      stats={stats}
      todaySummary={todaySummary}
      quickActionsData={{
        pendingAppointments: stats.pendingAppointments,
        overdueInvoices,
        unreadConversations,
      }}
      recentActivity={{
        bookings: recentBookings,
        conversations: recentConversations,
      }}
      customerSegments={customerSegments}
      companySlug={companySlug}
      locale={locale}
      period={period}
      customStartDate={isCustomPeriod ? startDate : undefined}
      customEndDate={isCustomPeriod ? endDate : undefined}
      currency={company.currency}
      primaryColor={company.primaryColor || undefined}
      translations={{
        title: t("title"),
        subtitle: t("subtitle"),
        totalAppointments: t("totalAppointments"),
        pendingAppointments: t("pendingAppointments"),
        completedAppointments: t("completedAppointments"),
        totalRevenue: t("totalRevenue"),
        totalCustomers: t("totalCustomers"),
        revenueTrend: t("revenueTrend"),
        appointmentsByStatus: t("appointmentsByStatus"),
        popularServices: t("popularServices"),
        appointmentsTrend: t("appointmentsTrend"),
        totalChatSessions: t("totalChatSessions"),
        totalChatMessages: t("totalChatMessages"),
        chatSessionsByType: t("chatSessionsByType"),
        chatActivityTrend: t("chatActivityTrend"),
        guestSessions: t("guestSessions"),
        authenticatedSessions: t("authenticatedSessions"),
        sessions: t("sessions"),
        messages: t("messages"),
        period7d: t("period7d"),
        period30d: t("period30d"),
        period90d: t("period90d"),
        period1y: t("period1y"),
        periodCustom: t("periodCustom"),
        selectDateRange: t("selectDateRange"),
        from: t("from"),
        to: t("to"),
        apply: t("apply"),
        vsLastPeriod: t("vsLastPeriod"),
        noData: t("noData"),
        appointments: t("appointments"),
        // Quick actions translations
        overdueInvoices: t("overdueInvoices"),
        unreadConversations: t("unreadConversations"),
        // Today summary translations
        todaySummary: t("todaySummary"),
        appointmentsToday: t("appointmentsToday"),
        confirmed: tAppointments("confirmed"),
        pending: tAppointments("pending"),
        completed: tAppointments("completed"),
        revenueToday: t("revenueToday"),
        nextAppointment: t("nextAppointment"),
        noAppointmentsToday: t("noAppointmentsToday"),
        at: tAppointments("at"),
        // Recent activity translations
        recentActivity: t("recentActivity"),
        recentBookings: t("recentBookings"),
        recentConversations: t("recentConversations"),
        viewAll: t("viewAll"),
        noRecentBookings: t("noRecentBookings"),
        noRecentConversations: t("noRecentConversations"),
        unread: t("unread"),
        loadMore: t("loadMore"),
        loading: t("loading"),
      }}
      statusLabels={{
        pending: tAppointments("pending"),
        confirmed: tAppointments("confirmed"),
        completed: tAppointments("completed"),
        cancelled: tAppointments("cancelled"),
      }}
      segmentLabels={{
        title: t("customerSegments"),
        new: t("segmentNew"),
        active: t("segmentActive"),
        loyal: t("segmentLoyal"),
        vip: t("segmentVip"),
        at_risk: t("segmentAtRisk"),
        churned: t("segmentChurned"),
      }}
      bookingChannelLabels={{
        title: t("bookingsByChannel"),
        website: t("sourceWebsite"),
        bot: t("sourceBot"),
        whatsapp: t("sourceWhatsapp"),
        admin: t("sourceAdmin"),
      }}
    />
  );
}
