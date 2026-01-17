import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, FileText } from "lucide-react";

interface SuperAdminDashboardProps {
  params: Promise<{ locale: string }>;
}

export default async function SuperAdminDashboard({
  params,
}: SuperAdminDashboardProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [
    companyCount,
    userCount,
    appointmentCount,
    invoiceCount,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.appointment.count(),
    prisma.invoice.count(),
  ]);

  const stats = [
    {
      title: "Total Companies",
      value: companyCount,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      title: "Total Users",
      value: userCount,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Total Appointments",
      value: appointmentCount,
      icon: Calendar,
      color: "text-purple-500",
    },
    {
      title: "Total Invoices",
      value: invoiceCount,
      icon: FileText,
      color: "text-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
