"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChatActivityChartProps {
  data: Array<{ date: string; sessions: number; messages: number }>;
  title: string;
  noDataMessage: string;
  sessionsLabel: string;
  messagesLabel: string;
  prefersReducedMotion?: boolean;
}

export function ChatActivityChart({
  data,
  title,
  noDataMessage,
  sessionsLabel,
  messagesLabel,
  prefersReducedMotion = false,
}: ChatActivityChartProps) {
  const hasData = data.some((d) => d.sessions > 0 || d.messages > 0);

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
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorChatSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorChatMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
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
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={30}
              />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "sessions" ? sessionsLabel : messagesLabel,
                ]}
                labelFormatter={formatDate}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-foreground">
                    {value === "sessions" ? sessionsLabel : messagesLabel}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#colorChatSessions)"
                isAnimationActive={!prefersReducedMotion}
                animationBegin={200}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#06B6D4"
                strokeWidth={2}
                fill="url(#colorChatMessages)"
                isAnimationActive={!prefersReducedMotion}
                animationBegin={400}
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
