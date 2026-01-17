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
