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

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { date: string } }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];

    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <div className="text-sm font-medium">{formatDate(data.payload.date)}</div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
          />
          <span className="text-sm text-muted-foreground">
            {data.value} {appointmentsLabel}
          </span>
        </div>
      </div>
    );
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
              <Tooltip content={<CustomTooltip />} />
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
