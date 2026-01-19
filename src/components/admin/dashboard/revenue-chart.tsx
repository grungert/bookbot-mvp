"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface RevenueChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  noDataMessage: string;
  currency?: string;
  prefersReducedMotion?: boolean;
  primaryColor?: string;
}

export function RevenueChart({
  data,
  title,
  noDataMessage,
  currency = "RSD",
  prefersReducedMotion = false,
  primaryColor,
}: RevenueChartProps) {
  // Use company primary color or fall back to CSS variable
  const chartColor = primaryColor || "hsl(var(--primary))";
  const hasData = data.some((d) => d.value > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatValue = (value: number) => {
    return `${currency} ${value.toLocaleString()}`;
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300",
        "hover:shadow-lg hover:border-primary/10"
      )}
    >
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          {noDataMessage}
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={40}
              />
              <Tooltip
                formatter={(value) => [formatValue(value as number), "Revenue"]}
                labelFormatter={formatDate}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorRevenue)"
                isAnimationActive={!prefersReducedMotion}
                animationBegin={200}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
