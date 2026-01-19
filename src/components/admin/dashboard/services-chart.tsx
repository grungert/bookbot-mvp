"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface ServiceData {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface ServicesChartProps {
  data: ServiceData[];
  title: string;
  noDataMessage: string;
  appointmentsLabel: string;
  prefersReducedMotion?: boolean;
}

export function ServicesChart({
  data,
  title,
  noDataMessage,
  appointmentsLabel,
  prefersReducedMotion = false,
}: ServicesChartProps) {
  const hasData = data.some((d) => d.count > 0);

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
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={100}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [
                  `${value} ${appointmentsLabel}`,
                  "",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
                isAnimationActive={!prefersReducedMotion}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
