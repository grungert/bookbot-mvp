import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatTokenCount } from "@/lib/utils/format-tokens";
import { SUBSCRIPTION_CONSTANTS } from "@/lib/constants/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Calendar,
  FileText,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

interface SuperAdminDashboardProps {
  params: Promise<{ locale: string }>;
}

export default async function SuperAdminDashboard({
  params,
}: SuperAdminDashboardProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get current month dates for chat usage
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  // Use constant instead of hardcoded 7 days (#20)
  const warningDays = SUBSCRIPTION_CONSTANTS.TRIAL_EXPIRY_WARNING_DAYS;
  const warningWindowEnd = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

  const [
    companyCount,
    userCount,
    appointmentCount,
    invoiceCount,
    subscriptionStats,
    activeSubscriptions,
    trialsExpiringSoon,
    totalChatUsage,
    pricingConfigs,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.appointment.count(),
    prisma.invoice.count(),
    prisma.userSubscription.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.userSubscription.findMany({
      where: { status: "ACTIVE" },
      include: {
        plan: {
          select: { tier: true },
        },
      },
    }),
    prisma.userSubscription.count({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: now,
          lte: warningWindowEnd,
        },
      },
    }),
    prisma.chatUsage.aggregate({
      where: { periodStart },
      _sum: { tokenCount: true },
    }),
    prisma.pricingConfig.findMany({
      where: {
        key: {
          in: ["PRO_BASE", "CHATBOT_ADDON", "EXTRA_COMPANY", "BUSINESS_BASE"],
        },
      },
    }),
  ]);

  // Build pricing lookup (cents to euros)
  const pricing: Record<string, number> = {};
  pricingConfigs.forEach((config) => {
    pricing[config.key] = config.priceEurCents / 100;
  });

  // Calculate monthly revenue using PricingConfig
  let monthlyRevenue = 0;
  activeSubscriptions.forEach((sub) => {
    if (sub.plan.tier === "BUSINESS") {
      monthlyRevenue += pricing.BUSINESS_BASE || 0;
    } else if (sub.plan.tier === "PRO") {
      monthlyRevenue += pricing.PRO_BASE || 0;
      if (sub.hasChatbot) {
        monthlyRevenue += pricing.CHATBOT_ADDON || 0;
      }
      if (sub.extraCompanySlots > 0) {
        monthlyRevenue += sub.extraCompanySlots * (pricing.EXTRA_COMPANY || 0);
      }
    }
    // TRIAL tier has no revenue
  });

  // Format subscription status counts
  const statusCounts: Record<string, number> = {
    TRIALING: 0,
    ACTIVE: 0,
    TRIAL_EXPIRED: 0,
    PAST_DUE: 0,
    CANCELLED: 0,
  };
  subscriptionStats.forEach((s) => {
    statusCounts[s.status] = s._count;
  });

  const totalSubscriptions = Object.values(statusCounts).reduce(
    (a, b) => a + b,
    0
  );
  const needsAttention = statusCounts.TRIAL_EXPIRED + statusCounts.PAST_DUE;

  const platformStats = [
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

  const subscriptionStatsData = [
    {
      title: "Monthly Revenue",
      value: `€${monthlyRevenue.toFixed(2)}`,
      subtitle: `${statusCounts.ACTIVE} active subscriptions`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Active Trials",
      value: statusCounts.TRIALING,
      subtitle: `${trialsExpiringSoon} expiring in ${warningDays} days`,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      title: "Needs Attention",
      value: needsAttention,
      subtitle: "Expired or past due",
      icon: AlertTriangle,
      color: needsAttention > 0 ? "text-amber-500" : "text-muted-foreground",
    },
    {
      title: "AI Tokens",
      value: formatTokenCount(totalChatUsage._sum.tokenCount || 0),
      subtitle: "This month",
      icon: MessageSquare,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Platform Overview</h1>

      {/* Platform Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((stat) => (
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

      {/* Subscription Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Subscription Overview</h2>
          <Link href="/super-admin/subscriptions">
            <Button variant="outline" size="sm">
              Manage Subscriptions
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {subscriptionStatsData.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
                Trialing
              </Badge>
              <span className="font-medium">{statusCounts.TRIALING}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                Active
              </Badge>
              <span className="font-medium">{statusCounts.ACTIVE}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/20 text-red-700 dark:text-red-400">
                Trial Expired
              </Badge>
              <span className="font-medium">{statusCounts.TRIAL_EXPIRED}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400">
                Past Due
              </Badge>
              <span className="font-medium">{statusCounts.PAST_DUE}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-400">
                Cancelled
              </Badge>
              <span className="font-medium">{statusCounts.CANCELLED}</span>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              Total: {totalSubscriptions} subscriptions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
