"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

const defaultWorkingHours: WorkingHour[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isOpen: false },
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isOpen: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isOpen: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isOpen: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isOpen: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isOpen: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isOpen: false },
];

export default function WorkingHoursPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("workingHours");
  const tCommon = useTranslations("common");

  const [workingHours, setWorkingHours] =
    useState<WorkingHour[]>(defaultWorkingHours);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Day names from translations
  const dayNames: Record<number, string> = {
    0: t("sunday"),
    1: t("monday"),
    2: t("tuesday"),
    3: t("wednesday"),
    4: t("thursday"),
    5: t("friday"),
    6: t("saturday"),
  };

  useEffect(() => {
    loadWorkingHours();
  }, [companySlug]);

  async function loadWorkingHours() {
    try {
      const response = await fetch(`/api/c/${companySlug}/working-hours`);
      if (response.ok) {
        const data = await response.json();
        // Merge API data with defaults to ensure all 7 days are present
        const mergedHours = defaultWorkingHours.map((defaultDay) => {
          const apiDay = data.find(
            (d: WorkingHour) => d.dayOfWeek === defaultDay.dayOfWeek
          );
          return apiDay || defaultDay;
        });
        setWorkingHours(mergedHours);
      }
    } catch (error) {
      console.error("Error loading working hours:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function updateDay(dayOfWeek: number, updates: Partial<WorkingHour>) {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, ...updates } : wh
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/working-hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workingHours),
      });

      if (!response.ok) {
        throw new Error("Failed to save working hours");
      }

      toast.success(tCommon("success"));
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle") || "Set your business availability"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {tCommon("save")}
        </Button>
      </div>

      {/* Working Hours Card */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t("weeklySchedule") || "Weekly Schedule"}
        </h3>
        <div className="space-y-2">
          {workingHours
            .sort((a, b) => {
              // Start from Monday (1) and end with Sunday (0)
              const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
              const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
              return orderA - orderB;
            })
            .map((wh) => (
              <div
                key={wh.dayOfWeek}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  wh.isOpen
                    ? "bg-background hover:border-primary/20"
                    : "bg-muted/30 border-dashed"
                }`}
              >
                <div className="w-28">
                  <span className={`font-medium text-sm ${!wh.isOpen ? "text-muted-foreground" : ""}`}>
                    {dayNames[wh.dayOfWeek]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={wh.isOpen}
                    onCheckedChange={(checked) =>
                      updateDay(wh.dayOfWeek, { isOpen: checked })
                    }
                  />
                  <span className={`text-xs font-medium w-14 ${wh.isOpen ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {wh.isOpen ? t("open") : t("closed")}
                  </span>
                </div>

                {wh.isOpen ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <Label htmlFor={`start-${wh.dayOfWeek}`} className="sr-only">
                      {t("startTime")}
                    </Label>
                    <Input
                      id={`start-${wh.dayOfWeek}`}
                      type="time"
                      value={wh.startTime}
                      onChange={(e) =>
                        updateDay(wh.dayOfWeek, { startTime: e.target.value })
                      }
                      className="w-28 h-9"
                    />
                    <span className="text-muted-foreground text-sm">—</span>
                    <Label htmlFor={`end-${wh.dayOfWeek}`} className="sr-only">
                      {t("endTime")}
                    </Label>
                    <Input
                      id={`end-${wh.dayOfWeek}`}
                      type="time"
                      value={wh.endTime}
                      onChange={(e) =>
                        updateDay(wh.dayOfWeek, { endTime: e.target.value })
                      }
                      className="w-28 h-9"
                    />
                  </div>
                ) : (
                  <div className="ml-auto text-sm text-muted-foreground italic">
                    {t("closedAllDay") || "Closed all day"}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
