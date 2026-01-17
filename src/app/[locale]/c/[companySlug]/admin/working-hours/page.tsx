"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

  useEffect(() => {
    loadWorkingHours();
  }, [companySlug]);

  async function loadWorkingHours() {
    try {
      const response = await fetch(`/api/c/${companySlug}/working-hours`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setWorkingHours(data);
        }
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {tCommon("save")}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {workingHours
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((wh) => (
                <div
                  key={wh.dayOfWeek}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="w-32">
                    <span className="font-medium">{dayNames[wh.dayOfWeek]}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={wh.isOpen}
                      onCheckedChange={(checked) =>
                        updateDay(wh.dayOfWeek, { isOpen: checked })
                      }
                    />
                    <span className="text-sm text-muted-foreground w-16">
                      {wh.isOpen ? t("open") : t("closed")}
                    </span>
                  </div>

                  {wh.isOpen && (
                    <>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`start-${wh.dayOfWeek}`} className="sr-only">
                          Start time
                        </Label>
                        <Input
                          id={`start-${wh.dayOfWeek}`}
                          type="time"
                          value={wh.startTime}
                          onChange={(e) =>
                            updateDay(wh.dayOfWeek, { startTime: e.target.value })
                          }
                          className="w-32"
                        />
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`end-${wh.dayOfWeek}`} className="sr-only">
                          End time
                        </Label>
                        <Input
                          id={`end-${wh.dayOfWeek}`}
                          type="time"
                          value={wh.endTime}
                          onChange={(e) =>
                            updateDay(wh.dayOfWeek, { endTime: e.target.value })
                          }
                          className="w-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
