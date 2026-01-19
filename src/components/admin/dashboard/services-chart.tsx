"use client";

import { useRouter } from "next/navigation";
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
  companySlug?: string;
  prefersReducedMotion?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ServiceData;
  }>;
  appointmentsLabel: string;
}

function CustomTooltip({ active, payload, appointmentsLabel }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const service = data.payload;

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: service.color }}
        />
        <span className="text-sm font-medium">{service.name}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {data.value} {appointmentsLabel}
      </div>
    </div>
  );
}

export function ServicesChart({
  data,
  title,
  noDataMessage,
  appointmentsLabel,
  companySlug,
  prefersReducedMotion = false,
}: ServicesChartProps) {
  const router = useRouter();
  const hasData = data.some((d) => d.count > 0);

  const handleClick = (serviceId: string) => {
    if (companySlug) {
      router.push(`/${companySlug}/admin/services/${serviceId}`);
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
                content={<CustomTooltip appointmentsLabel={appointmentsLabel} />}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
                isAnimationActive={!prefersReducedMotion}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
                onClick={(barData) => barData.id && handleClick(barData.id)}
                style={{ cursor: companySlug ? "pointer" : "default" }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    className={companySlug ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
