"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, FileText } from "lucide-react";

interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

interface AboutSectionProps {
  description: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  workingHours: WorkingHour[];
}

export function AboutSection({
  description,
  businessPhone,
  businessEmail,
  businessAddress,
  workingHours,
}: AboutSectionProps) {
  const t = useTranslations("about");
  const tHours = useTranslations("workingHours");

  // Check if there's any data to display
  const hasDescription = !!description;
  const hasContact = !!businessPhone || !!businessEmail || !!businessAddress;
  const hasWorkingHours = workingHours.length > 0;

  if (!hasDescription && !hasContact && !hasWorkingHours) {
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
    return time.substring(0, 5); // Format HH:MM from HH:MM:SS
  };

  // Sort working hours by day of week (Monday first)
  const sortedHours = [...workingHours].sort((a, b) => {
    // Convert Sunday (0) to 7 for sorting purposes so it appears last
    const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return dayA - dayB;
  });

  return (
    <section className="container mx-auto px-4 py-12 border-t">
      <h2 className="text-2xl font-bold mb-6 animate-fade-up" style={{ opacity: 0 }}>
        {t("title")}
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* About Card */}
        {hasDescription && (
          <Card className="animate-fade-in-scale stagger-2" style={{ opacity: 0 }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                {t("description")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact Card */}
        {hasContact && (
          <Card className="animate-fade-in-scale stagger-3" style={{ opacity: 0 }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                {t("contact")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {businessPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={`tel:${businessPhone}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {businessPhone}
                  </a>
                </div>
              )}
              {businessEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${businessEmail}`}
                    className="text-muted-foreground hover:text-foreground transition-colors break-all"
                  >
                    {businessEmail}
                  </a>
                </div>
              )}
              {businessAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{businessAddress}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Working Hours Card */}
        {hasWorkingHours && (
          <Card className="animate-fade-in-scale stagger-4" style={{ opacity: 0 }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {t("hours")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedHours.map((hour) => (
                  <div
                    key={hour.dayOfWeek}
                    className="flex justify-between text-sm"
                  >
                    <span className="font-medium">{dayNames[hour.dayOfWeek]}</span>
                    <span className="text-muted-foreground">
                      {hour.isOpen
                        ? `${formatTime(hour.startTime)} - ${formatTime(hour.endTime)}`
                        : tHours("closed")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
