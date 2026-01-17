import { setRequestLocale } from "next-intl/server";
import { getCompanyBySlug, getCompanyStats } from "@/lib/db/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, CheckCircle } from "lucide-react";

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
      color: "text-blue-500",
    },
    {
      title: "Pending",
      value: stats.pendingAppointments,
      icon: CheckCircle,
      color: "text-yellow-500",
    },
    {
      title: "Completed",
      value: stats.completedAppointments,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Total Revenue",
      value: `RSD ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
