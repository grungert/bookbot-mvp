"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Circle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface ChecklistProgress {
  hasService: boolean;
  hasWorkingHours: boolean;
  hasCompanySettings: boolean;
  hasLogo: boolean;
  hasBookingChannel: boolean;
  hasBotPersonality: boolean;
  hasAppointment: boolean;
  hasSentInvoice: boolean;
  hasDocument: boolean;
}

interface ChecklistItem {
  id: keyof ChecklistProgress;
  titleKey: string;
  descriptionKey: string;
  href: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "hasService",
    titleKey: "onboarding.checklist.addService.title",
    descriptionKey: "onboarding.checklist.addService.description",
    href: "/services",
  },
  {
    id: "hasWorkingHours",
    titleKey: "onboarding.checklist.setWorkingHours.title",
    descriptionKey: "onboarding.checklist.setWorkingHours.description",
    href: "/working-hours",
  },
  {
    id: "hasCompanySettings",
    titleKey: "onboarding.checklist.configureSettings.title",
    descriptionKey: "onboarding.checklist.configureSettings.description",
    href: "/settings",
  },
  {
    id: "hasLogo",
    titleKey: "onboarding.checklist.uploadLogo.title",
    descriptionKey: "onboarding.checklist.uploadLogo.description",
    href: "/settings#appearance",
  },
  {
    id: "hasBookingChannel",
    titleKey: "onboarding.checklist.enableChannel.title",
    descriptionKey: "onboarding.checklist.enableChannel.description",
    href: "/settings#channels",
  },
  {
    id: "hasBotPersonality",
    titleKey: "onboarding.checklist.customizeBot.title",
    descriptionKey: "onboarding.checklist.customizeBot.description",
    href: "/settings#bot-personality",
  },
  {
    id: "hasAppointment",
    titleKey: "onboarding.checklist.createAppointment.title",
    descriptionKey: "onboarding.checklist.createAppointment.description",
    href: "/appointments",
  },
  {
    id: "hasSentInvoice",
    titleKey: "onboarding.checklist.sendInvoice.title",
    descriptionKey: "onboarding.checklist.sendInvoice.description",
    href: "/invoices",
  },
  {
    id: "hasDocument",
    titleKey: "onboarding.checklist.uploadDocument.title",
    descriptionKey: "onboarding.checklist.uploadDocument.description",
    href: "/documents",
  },
];

interface OnboardingChecklistProps {
  primaryColor?: string | null;
  onNavigate?: () => void;
}

export function OnboardingChecklist({ primaryColor, onNavigate }: OnboardingChecklistProps) {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations();
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/c/${companySlug}/onboarding/progress`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [companySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!progress) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t("onboarding.checklist.loadError")}
      </p>
    );
  }

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {t("onboarding.checklist.progress", { completed: completedCount, total: totalCount })}
          </span>
          <span className="text-muted-foreground">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: primaryColor || "hsl(var(--primary))",
            }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {checklistItems.map((item) => {
          const isCompleted = progress[item.id];
          return (
            <li key={item.id}>
              <Link
                href={`/c/${companySlug}/admin${item.href}`}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  "hover:bg-muted/50",
                  isCompleted && "bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    isCompleted
                      ? "text-white"
                      : "border-2 border-muted-foreground/30"
                  )}
                  style={
                    isCompleted
                      ? { backgroundColor: primaryColor || "hsl(var(--primary))" }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "line-through text-muted-foreground"
                    )}
                  >
                    {t(item.titleKey)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t(item.descriptionKey)}
                  </p>
                </div>
                {!isCompleted && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
