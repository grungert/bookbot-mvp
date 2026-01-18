"use client";

import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

interface AboutSectionProps {
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  workingHours: WorkingHour[];
}

export function AboutSection({
  businessPhone,
  businessEmail,
  businessAddress,
  workingHours,
}: AboutSectionProps) {
  const t = useTranslations("about");
  const tHours = useTranslations("workingHours");

  const hasContact = !!businessPhone || !!businessEmail || !!businessAddress;
  const hasWorkingHours = workingHours.length > 0;

  if (!hasContact && !hasWorkingHours) {
    return null;
  }

  const dayNames = [
    tHours("sunday"),
    tHours("monday"),
    tHours("tuesday"),
    tHours("wednesday"),
    tHours("thursday"),
    tHours("friday"),
    tHours("saturday"),
  ];

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Sort working hours by day of week (Monday first)
  const sortedHours = [...workingHours].sort((a, b) => {
    const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return dayA - dayB;
  });

  // Get today's status
  const today = new Date().getDay();
  const todayHours = workingHours.find((h) => h.dayOfWeek === today);

  return (
    <section className="container mx-auto px-4 py-8 animate-fade-up" style={{ opacity: 0 }}>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        {/* Contact Info */}
        {businessPhone && (
          <a
            href={`tel:${businessPhone}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span>{businessPhone}</span>
          </a>
        )}

        {businessEmail && (
          <a
            href={`mailto:${businessEmail}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span>{businessEmail}</span>
          </a>
        )}

        {businessAddress && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{businessAddress}</span>
          </div>
        )}

        {/* Today's Hours */}
        {hasWorkingHours && todayHours && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  todayHours.isOpen ? "bg-green-500" : "bg-red-400"
                )}
              />
              {todayHours.isOpen
                ? `${t("openToday")} ${formatTime(todayHours.startTime)} - ${formatTime(todayHours.endTime)}`
                : tHours("closedToday")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
