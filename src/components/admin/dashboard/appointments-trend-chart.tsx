"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface AppointmentsTrendChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  noDataMessage: string;
  appointmentsLabel: string;
  primaryColor?: string;
  prefersReducedMotion?: boolean;
}

export function AppointmentsTrendChart({
  data,
  title,
  noDataMessage,
  appointmentsLabel,
  primaryColor,
  prefersReducedMotion = false,
}: AppointmentsTrendChartProps) {
  const hasData = data.some((d) => d.value > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [
                  `${value} ${appointmentsLabel}`,
                  "",
                ]}
                labelFormatter={formatDate}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="value"
                fill={primaryColor || "hsl(var(--primary))"}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                isAnimationActive={!prefersReducedMotion}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
