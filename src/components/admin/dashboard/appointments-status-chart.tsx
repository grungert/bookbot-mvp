"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface AppointmentsStatusChartProps {
  data: {
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  title: string;
  noDataMessage: string;
  labels: {
    pending: string;
    confirmed: string;
    completed: string;
    cancelled: string;
  };
  companySlug?: string;
  prefersReducedMotion?: boolean;
}

// Status-specific colors matching the app's status badge colors
const COLORS = {
  PENDING: "#F59E0B",    // Amber/Yellow - matches bg-yellow-* badges
  CONFIRMED: "#22C55E",  // Green - matches bg-green-* badges
  COMPLETED: "#3B82F6",  // Blue - matches bg-blue-* badges
  CANCELLED: "#EF4444",  // Red - matches bg-red-* badges
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { status: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const color = COLORS[data.payload.status as keyof typeof COLORS];

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

export function AppointmentsStatusChart({
  data,
  title,
  noDataMessage,
  labels,
  companySlug,
  prefersReducedMotion = false,
}: AppointmentsStatusChartProps) {
  const router = useRouter();

  const chartData = [
    { name: labels.pending, value: data.PENDING, status: "PENDING" },
    { name: labels.confirmed, value: data.CONFIRMED, status: "CONFIRMED" },
    { name: labels.completed, value: data.COMPLETED, status: "COMPLETED" },
    { name: labels.cancelled, value: data.CANCELLED, status: "CANCELLED" },
  ].filter((d) => d.value > 0);

  const hasData = chartData.length > 0;

  const handleClick = (status: string) => {
    if (companySlug) {
      router.push(`/${companySlug}/admin/appointments?status=${status}`);
    }
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
                onClick={(_, index) => handleClick(chartData[index].status)}
                style={{ cursor: companySlug ? "pointer" : "default" }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={COLORS[entry.status as keyof typeof COLORS]}
                    strokeWidth={0}
                    className={companySlug ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
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
