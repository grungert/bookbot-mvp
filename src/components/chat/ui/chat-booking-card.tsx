"use client";

import { CheckCircle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTranslator } from "@/lib/i18n/backend";
import type { ChatBookingData } from "../types";

interface ChatBookingCardProps {
  booking: ChatBookingData;
  language?: string;
  animate?: boolean;
}

export function ChatBookingCard({ booking, language }: ChatBookingCardProps) {
  const t = getTranslator(language);

  const statusLabels: Record<string, string> = {
    PENDING: t("botChat.chatUI.statusPending"),
    CONFIRMED: t("botChat.chatUI.statusConfirmed"),
    CANCELLED: t("botChat.chatUI.statusCancelled"),
  };

  return (
    <div className="mt-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 max-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          {t("botChat.chatUI.bookingConfirmed")}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground">{t("botChat.chatUI.service")}</span>
          <span className="font-medium text-right">{booking.service}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("botChat.chatUI.date")}
          </span>
          <span className="font-medium">{booking.date}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("botChat.chatUI.time")}
          </span>
          <span className="font-medium">{booking.time}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{t("botChat.chatUI.duration")}</span>
          <span className="font-medium">{booking.duration}</span>
        </div>

        {booking.price && (
          <div className="flex justify-between items-center pt-1 border-t border-green-200 dark:border-green-800">
            <span className="text-muted-foreground">{t("botChat.chatUI.price")}</span>
            <Badge variant="secondary" className="text-xs">
              {booking.price}
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-green-200 dark:border-green-800">
        <Badge
          variant={booking.status === "CONFIRMED" ? "default" : "secondary"}
          className="text-xs"
        >
          {statusLabels[booking.status] || booking.status}
        </Badge>
      </div>
    </div>
  );
}
