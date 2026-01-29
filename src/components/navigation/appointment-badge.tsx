"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENTS_CHANNEL, type AppointmentEvent } from "@/lib/broadcast-channel";

interface AppointmentBadgeProps {
  initialCount: number;
}

export function AppointmentBadge({ initialCount }: AppointmentBadgeProps) {
  const [count, setCount] = useState(initialCount);

  // Fetch current count from API
  const fetchCount = async () => {
    try {
      const res = await fetch("/api/user/appointments/count", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch (error) {
      console.error("[AppointmentBadge] Failed to fetch count:", error);
    }
  };

  // Listen for broadcast messages to refetch count
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(APPOINTMENTS_CHANNEL);
    channel.onmessage = (event: MessageEvent<AppointmentEvent>) => {
      if (event.data.type === "new-booking" || event.data.type === "cancelled") {
        fetchCount();
      }
    };

    return () => channel.close();
  }, []);

  if (count <= 0) return null;

  return (
    <Badge
      variant="default"
      className="h-5 min-w-5 px-1.5 text-xs rounded-full"
    >
      {count}
    </Badge>
  );
}
