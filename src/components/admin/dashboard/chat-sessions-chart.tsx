"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface ChatSessionsChartProps {
  data: {
    guest: number;
    authenticated: number;
  };
  title: string;
  noDataMessage: string;
  labels: {
    guest: string;
    authenticated: string;
  };
  prefersReducedMotion?: boolean;
}

// Colors for guest vs authenticated sessions
const COLORS = {
  guest: "#94A3B8",      // Slate/gray for guests
  authenticated: "#8B5CF6", // Purple for authenticated users
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { type: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const color = COLORS[data.payload.type as keyof typeof COLORS];

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

export function ChatSessionsChart({
  data,
  title,
  noDataMessage,
  labels,
  prefersReducedMotion = false,
}: ChatSessionsChartProps) {
  const chartData = [
    { name: labels.guest, value: data.guest, type: "guest" },
    { name: labels.authenticated, value: data.authenticated, type: "authenticated" },
  ].filter((d) => d.value > 0);

  const hasData = chartData.length > 0;

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
                    key={entry.type}
                    fill={COLORS[entry.type as keyof typeof COLORS]}
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
