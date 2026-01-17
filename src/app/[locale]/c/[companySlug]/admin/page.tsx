import { setRequestLocale } from "next-intl/server";
import { getCompanyBySlug, getCompanyStats } from "@/lib/db/tenant";
import { Calendar, Users, DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface AdminDashboardProps {
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const company = await getCompanyBySlug(companySlug);
  if (!company) return null;

  const stats = await getCompanyStats(company.id);

  const statCards = [
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      icon: Calendar,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Pending",
      value: stats.pendingAppointments,
      icon: Clock,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Completed",
      value: stats.completedAppointments,
      icon: CheckCircle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Total Revenue",
      value: `RSD ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your business performance
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Quick Stats
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="group relative rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
