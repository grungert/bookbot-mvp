"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface CustomerSegmentsChartProps {
  data: {
    new: number;
    active: number;
    loyal: number;
    vip: number;
    at_risk: number;
    churned: number;
  };
  title: string;
  noDataMessage: string;
  labels: {
    new: string;
    active: string;
    loyal: string;
    vip: string;
    at_risk: string;
    churned: string;
  };
  prefersReducedMotion?: boolean;
}

// Segment-specific colors
const COLORS = {
  new: "#3B82F6",      // Blue - new customers
  active: "#22C55E",   // Green - active customers
  loyal: "#8B5CF6",    // Purple - loyal customers
  vip: "#F59E0B",      // Amber - VIP customers
  at_risk: "#F97316",  // Orange - at risk
  churned: "#EF4444",  // Red - churned
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { segment: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const color = COLORS[data.payload.segment as keyof typeof COLORS];

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium">{data.name}</span>
        <span className="text-sm text-muted-foreground">({data.value})</span>
      </div>
    </div>
  );
}

export function CustomerSegmentsChart({
  data,
  title,
  noDataMessage,
  labels,
  prefersReducedMotion = false,
}: CustomerSegmentsChartProps) {
  const chartData = [
    { name: labels.new, value: data.new, segment: "new" },
    { name: labels.active, value: data.active, segment: "active" },
    { name: labels.loyal, value: data.loyal, segment: "loyal" },
    { name: labels.vip, value: data.vip, segment: "vip" },
    { name: labels.at_risk, value: data.at_risk, segment: "at_risk" },
    { name: labels.churned, value: data.churned, segment: "churned" },
  ].filter((d) => d.value > 0);

  const hasData = chartData.length > 0;
  const totalCustomers = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300",
        "hover:shadow-lg hover:border-primary/10"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hasData && (
          <span className="text-xs text-muted-foreground">
            {totalCustomers} total
          </span>
        )}
      </div>
      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          {noDataMessage}
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={!prefersReducedMotion}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.segment}
                    fill={COLORS[entry.segment as keyof typeof COLORS]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
