import { prisma } from "@/lib/prisma";

export type CustomerSegment = "new" | "active" | "loyal" | "vip" | "at_risk" | "churned";

export type CustomerSource = "google" | "referral" | "direct" | "social" | "other";

interface UpdateMetricsResult {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  avgBookingValue: number;
  customerSegment: CustomerSegment;
}

/**
 * Recalculate and update customer metrics for a user.
 * Call this after appointment status changes (COMPLETED or CANCELLED).
 */
export async function updateCustomerMetrics(userId: string): Promise<UpdateMetricsResult | null> {
  try {
    // Get all appointments for this user with their invoice data
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        invoice: {
          select: { total: true, status: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (appointments.length === 0) {
      return null;
    }

    // Calculate metrics
    const totalBookings = appointments.length;
    const completedBookings = appointments.filter((a) => a.status === "COMPLETED").length;
    const cancelledBookings = appointments.filter((a) => a.status === "CANCELLED").length;

    // Sum up paid invoices
    const totalSpent = appointments.reduce((sum, apt) => {
      if (apt.invoice && apt.invoice.status === "PAID") {
        return sum + Number(apt.invoice.total);
      }
      return sum;
    }, 0);

    // Calculate average booking value (from completed/paid only)
    const avgBookingValue = completedBookings > 0
      ? totalSpent / completedBookings
      : 0;

    // Get first and last booking dates
    const firstBookingAt = appointments[0]?.createdAt;
    const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");
    const lastBookingAt = completedAppointments.length > 0
      ? completedAppointments[completedAppointments.length - 1].startTime
      : null;

    // Classify customer segment
    const customerSegment = classifyCustomerSegment({
      completedBookings,
      cancelledBookings,
      totalSpent,
      lastBookingAt,
    });

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalSpent,
        avgBookingValue,
        firstBookingAt,
        lastBookingAt,
        customerSegment,
      },
    });

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalSpent,
      avgBookingValue,
      customerSegment,
    };
  } catch (error) {
    console.error("Failed to update customer metrics:", error);
    return null;
  }
}

interface ClassifyParams {
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  lastBookingAt: Date | null;
}

/**
 * Classify customer into a segment based on their behavior.
 */
export function classifyCustomerSegment({
  completedBookings,
  cancelledBookings,
  totalSpent,
  lastBookingAt,
}: ClassifyParams): CustomerSegment {
  const now = new Date();
  const daysSinceLastBooking = lastBookingAt
    ? Math.floor((now.getTime() - lastBookingAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // New customer: 0-1 completed bookings
  if (completedBookings <= 1) {
    return "new";
  }

  // Churned: No booking in 180+ days
  if (daysSinceLastBooking !== null && daysSinceLastBooking > 180) {
    return "churned";
  }

  // At risk: No booking in 90-180 days
  if (daysSinceLastBooking !== null && daysSinceLastBooking > 90) {
    return "at_risk";
  }

  // VIP: High spender (10+ bookings OR spent 50000+) and active
  const isHighSpender = completedBookings >= 10 || totalSpent >= 50000;
  if (isHighSpender && daysSinceLastBooking !== null && daysSinceLastBooking <= 60) {
    return "vip";
  }

  // Loyal: 5+ completed bookings with low cancellation rate
  const cancellationRate = cancelledBookings / (completedBookings + cancelledBookings);
  if (completedBookings >= 5 && cancellationRate < 0.2) {
    return "loyal";
  }

  // Active: Regular customer
  return "active";
}

/**
 * Batch recalculate metrics for all users in a company.
 * Useful for initial migration or periodic recalculation.
 */
export async function recalculateAllCustomerMetrics(companyId: string): Promise<number> {
  const users = await prisma.user.findMany({
    where: { companyId },
    select: { id: true },
  });

  let updated = 0;
  for (const user of users) {
    const result = await updateCustomerMetrics(user.id);
    if (result) updated++;
  }

  return updated;
}

/**
 * Get customer segment distribution for a company.
 * Counts users who have made appointments with this company.
 */
export async function getCustomerSegmentStats(companyId: string): Promise<Record<CustomerSegment, number>> {
  try {
    // Get unique users who have appointments with this company
    const usersWithAppointments = await prisma.appointment.findMany({
      where: { companyId },
      select: { userId: true },
      distinct: ["userId"],
    });

    const userIds = usersWithAppointments.map((a) => a.userId);

    if (userIds.length === 0) {
      return {
        new: 0,
        active: 0,
        loyal: 0,
        vip: 0,
        at_risk: 0,
        churned: 0,
      };
    }

    // Count users by segment
    const [newCount, activeCount, loyalCount, vipCount, atRiskCount, churnedCount, nullCount] = await Promise.all([
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: "new" } }),
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: "active" } }),
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: "loyal" } }),
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: "vip" } }),
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: "at_risk" } }),
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: "churned" } }),
      // Users with null segment are considered "new"
      prisma.user.count({ where: { id: { in: userIds }, customerSegment: null } }),
    ]);

    return {
      new: newCount + nullCount,
      active: activeCount,
      loyal: loyalCount,
      vip: vipCount,
      at_risk: atRiskCount,
      churned: churnedCount,
    };
  } catch (error) {
    console.error("Failed to get customer segment stats:", error);
    return {
      new: 0,
      active: 0,
      loyal: 0,
      vip: 0,
      at_risk: 0,
      churned: 0,
    };
  }
}

/**
 * Get top customers by total spent.
 */
export async function getTopCustomers(companyId: string, limit = 10) {
  return prisma.user.findMany({
    where: {
      companyId,
      completedBookings: { gt: 0 },
    },
    orderBy: { totalSpent: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      customerSegment: true,
      totalBookings: true,
      completedBookings: true,
      totalSpent: true,
      avgBookingValue: true,
      lastBookingAt: true,
    },
  });
}
