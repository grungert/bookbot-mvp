import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cache } from "react";

// Get company by slug (cached per request)
export const getCompanyBySlug = cache(async (slug: string) => {
  return prisma.company.findUnique({
    where: { slug },
  });
});

// Get company with related data
export const getCompanyWithServices = cache(async (slug: string) => {
  return prisma.company.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      workingHours: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });
});

// Validate that user has access to company
export async function validateCompanyAccess(companySlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized", company: null };
  }

  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    return { error: "Company not found", company: null };
  }

  // Super admin can access any company
  if (user.role === "SUPER_ADMIN") {
    return { error: null, company, user };
  }

  // Company admin/user must belong to this company
  if (user.companyId !== company.id) {
    return { error: "Access denied", company: null };
  }

  return { error: null, company, user };
}

// Validate company admin access
export async function validateCompanyAdminAccess(companySlug: string) {
  const result = await validateCompanyAccess(companySlug);

  if (result.error) {
    return result;
  }

  if (result.user!.role !== "SUPER_ADMIN" && result.user!.role !== "COMPANY_ADMIN") {
    return { error: "Admin access required", company: null };
  }

  return result;
}

// Create company (super admin only)
export async function createCompany(data: {
  name: string;
  slug: string;
  description?: string;
  timezone?: string;
  primaryColor?: string;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.company.create({
    data: {
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: data.description,
      timezone: data.timezone || "Europe/Belgrade",
      primaryColor: data.primaryColor || "#3B82F6",
    },
  });
}

// Update company
export async function updateCompany(
  companyId: string,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    primaryColor?: string;
    timezone?: string;
    aiApiKey?: string;
    aiEndpoint?: string;
    aiModel?: string;
    aiSystemPrompt?: string;
  }
) {
  return prisma.company.update({
    where: { id: companyId },
    data,
  });
}

// Get all companies (super admin only)
export async function getAllCompanies() {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.company.findMany({
    include: {
      _count: {
        select: {
          users: true,
          services: true,
          appointments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Get company stats
export async function getCompanyStats(companyId: string) {
  const [
    appointmentCount,
    pendingAppointments,
    completedAppointments,
    invoiceTotal,
    userCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: { companyId } }),
    prisma.appointment.count({ where: { companyId, status: "PENDING" } }),
    prisma.appointment.count({ where: { companyId, status: "COMPLETED" } }),
    prisma.invoice.aggregate({
      where: { companyId, status: "PAID" },
      _sum: { total: true },
    }),
    prisma.user.count({ where: { companyId } }),
  ]);

  return {
    totalAppointments: appointmentCount,
    pendingAppointments,
    completedAppointments,
    totalRevenue: invoiceTotal._sum.total?.toNumber() || 0,
    totalUsers: userCount,
  };
}

// Period type for dashboard
export type DashboardPeriod = "7d" | "30d" | "90d" | "1y";

// Helper function to get period dates
function getPeriodDates(period: DashboardPeriod, customStart?: Date, customEnd?: Date) {
  const now = new Date();

  // If custom dates provided, use them
  if (customStart && customEnd) {
    const periodStart = new Date(customStart);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(customEnd);
    periodEnd.setHours(23, 59, 59, 999);

    // Calculate previous period based on the custom range length
    const rangeDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(periodStart);
    previousStart.setDate(previousStart.getDate() - rangeDays);

    return { periodStart, previousStart, now, periodEnd };
  }

  const periodDays = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };

  const days = periodDays[period];
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days);
  periodStart.setHours(0, 0, 0, 0);

  const previousStart = new Date(periodStart);
  previousStart.setDate(previousStart.getDate() - days);

  // Include future appointments (up to the same period length ahead)
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + days);
  periodEnd.setHours(23, 59, 59, 999);

  return { periodStart, previousStart, now, periodEnd };
}

// Get company dashboard stats for a specific period
export async function getCompanyDashboardStats(
  companyId: string,
  period: DashboardPeriod = "30d",
  customStartDate?: string,
  customEndDate?: string
) {
  const customStart = customStartDate ? new Date(customStartDate) : undefined;
  const customEnd = customEndDate ? new Date(customEndDate) : undefined;
  const { periodStart, previousStart, now, periodEnd } = getPeriodDates(period, customStart, customEnd);

  const [
    // Current period stats
    appointmentsByStatus,
    currentRevenue,
    currentAppointmentCount,

    // Previous period stats (for comparison)
    previousRevenue,
    previousAppointmentCount,

    // Trend data
    appointmentsTrend,
    revenueTrend,

    // Service stats
    serviceStats,

    // Unique customers in period
    uniqueCustomers,
  ] = await Promise.all([
    // Appointments grouped by status for current period (includes future)
    prisma.appointment.groupBy({
      by: ["status"],
      _count: true,
      where: {
        companyId,
        startTime: { gte: periodStart, lte: periodEnd },
      },
    }),

    // Current period revenue
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        companyId,
        status: "PAID",
        createdAt: { gte: periodStart },
      },
    }),

    // Current period total appointments (includes future)
    prisma.appointment.count({
      where: {
        companyId,
        startTime: { gte: periodStart, lte: periodEnd },
      },
    }),

    // Previous period revenue (for trend calculation)
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        companyId,
        status: "PAID",
        createdAt: { gte: previousStart, lt: periodStart },
      },
    }),

    // Previous period appointments
    prisma.appointment.count({
      where: {
        companyId,
        startTime: { gte: previousStart, lt: periodStart },
      },
    }),

    // Daily appointment counts for trend chart (includes future scheduled appointments)
    prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', "startTime") as date, COUNT(*) as count
      FROM "Appointment"
      WHERE "companyId" = ${companyId}
        AND "startTime" >= ${periodStart}
        AND "startTime" <= ${periodEnd}
      GROUP BY DATE_TRUNC('day', "startTime")
      ORDER BY date ASC
    `,

    // Daily revenue for area chart
    prisma.$queryRaw<Array<{ date: Date; total: number }>>`
      SELECT DATE_TRUNC('day', "createdAt") as date, COALESCE(SUM(total), 0) as total
      FROM "Invoice"
      WHERE "companyId" = ${companyId}
        AND status = 'PAID'
        AND "createdAt" >= ${periodStart}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,

    // Service popularity (appointments per service, includes future)
    prisma.service.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            appointments: {
              where: {
                startTime: { gte: periodStart, lte: periodEnd },
              },
            },
          },
        },
      },
      orderBy: {
        appointments: {
          _count: "desc",
        },
      },
      take: 5,
    }),

    // Unique customers in period (includes future)
    prisma.appointment.groupBy({
      by: ["userId"],
      where: {
        companyId,
        startTime: { gte: periodStart, lte: periodEnd },
      },
    }),
  ]);

  // Calculate trends (percentage change)
  const currentRevenueValue = currentRevenue._sum.total?.toNumber() || 0;
  const previousRevenueValue = previousRevenue._sum.total?.toNumber() || 0;
  const revenueTrendPercent = previousRevenueValue > 0
    ? Math.round(((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100)
    : 0;

  const appointmentTrendPercent = previousAppointmentCount > 0
    ? Math.round(((currentAppointmentCount - previousAppointmentCount) / previousAppointmentCount) * 100)
    : 0;

  // Format status counts
  const statusCounts = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };
  appointmentsByStatus.forEach((item) => {
    statusCounts[item.status] = item._count;
  });

  // Format service stats
  const formattedServiceStats = serviceStats.map((service) => ({
    id: service.id,
    name: service.name,
    color: service.color || "#3B82F6",
    count: service._count.appointments,
  }));

  // Format trend data for charts (fill in missing dates)
  // Appointments include future scheduled dates
  const formattedAppointmentsTrend = formatTrendData(
    appointmentsTrend.map((d) => ({ date: d.date, value: Number(d.count) })),
    periodStart,
    periodEnd
  );

  // Revenue only shows historical data (up to now)
  const formattedRevenueTrend = formatTrendData(
    revenueTrend.map((d) => ({ date: d.date, value: Number(d.total) })),
    periodStart,
    now
  );

  return {
    // Summary stats
    totalAppointments: currentAppointmentCount,
    appointmentTrend: appointmentTrendPercent,
    pendingAppointments: statusCounts.PENDING,
    confirmedAppointments: statusCounts.CONFIRMED,
    completedAppointments: statusCounts.COMPLETED,
    cancelledAppointments: statusCounts.CANCELLED,
    totalRevenue: currentRevenueValue,
    revenueTrend: revenueTrendPercent,
    totalCustomers: uniqueCustomers.length,

    // Chart data
    appointmentsByStatus: statusCounts,
    appointmentsTrendData: formattedAppointmentsTrend,
    revenueTrendData: formattedRevenueTrend,
    serviceStats: formattedServiceStats,
  };
}

// Helper to format trend data with all dates filled in
function formatTrendData(
  data: Array<{ date: Date; value: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const dateMap = new Map<string, number>();

  // Add existing data to map
  data.forEach((item) => {
    const dateStr = item.date.toISOString().split("T")[0];
    dateMap.set(dateStr, item.value);
  });

  // Fill in all dates
  const result: Array<{ date: string; value: number }> = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      value: dateMap.get(dateStr) || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}
