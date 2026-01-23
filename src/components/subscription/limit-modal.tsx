"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { AlertTriangle, MessageSquare, FileText, Building2, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type LimitType = "CHAT_LIMIT" | "DOCUMENT_LIMIT" | "COMPANY_LIMIT";

interface LimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: LimitType;
  currentUsage: number;
  limit: number;
  resetsAt?: Date | null;
  onUpgrade?: () => void;
}

const limitConfig: Record<
  LimitType,
  {
    icon: typeof MessageSquare;
    titleKey: string;
    descriptionKey: string;
    color: string;
  }
> = {
  CHAT_LIMIT: {
    icon: MessageSquare,
    titleKey: "chatLimitReached",
    descriptionKey: "chatLimitReachedDescription",
    color: "text-blue-500",
  },
  DOCUMENT_LIMIT: {
    icon: FileText,
    titleKey: "documentLimitReached",
    descriptionKey: "documentLimitReachedDescription",
    color: "text-purple-500",
  },
  COMPANY_LIMIT: {
    icon: Building2,
    titleKey: "companyLimitReached",
    descriptionKey: "companyLimitReachedDescription",
    color: "text-amber-500",
  },
};

export function LimitModal({
  open,
  onOpenChange,
  limitType,
  currentUsage,
  limit,
  resetsAt,
  onUpgrade,
}: LimitModalProps) {
  const t = useTranslations("subscription");
  const tCommon = useTranslations("common");
  const config = limitConfig[limitType];
  const Icon = config.icon;

  const formattedResetDate = resetsAt
    ? new Date(resetsAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      })
    : null;

  // Calculate progress bar percentage
  const progressPercent = limit > 0 ? Math.min(100, (currentUsage / limit) * 100) : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Icon className={cn("h-7 w-7", config.color)} />
          </div>
          <DialogTitle className="text-xl">{t(config.titleKey)}</DialogTitle>
          <DialogDescription>
            {t(config.descriptionKey)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Usage display */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("currentUsage")}</span>
              <span className="font-semibold text-destructive">
                {currentUsage.toLocaleString()} / {limit.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Reset info for chat limits */}
          {limitType === "CHAT_LIMIT" && formattedResetDate && (
            <p className="text-sm text-muted-foreground text-center">
              {t("limitResetsOn", { date: formattedResetDate })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onUpgrade} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {t("upgradePlan")}
          </Button>
          <Link href="/contact" className="w-full">
            <Button variant="outline" className="w-full">
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("contactSupport")}
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage limit modal state
export function useLimitModal() {
  const [modalState, setModalState] = useState<{
    open: boolean;
    limitType: LimitType;
    currentUsage: number;
    limit: number;
    resetsAt?: Date | null;
  }>({
    open: false,
    limitType: "CHAT_LIMIT",
    currentUsage: 0,
    limit: 0,
    resetsAt: null,
  });

  const showLimitModal = (
    limitType: LimitType,
    currentUsage: number,
    limit: number,
    resetsAt?: Date | null
  ) => {
    setModalState({
      open: true,
      limitType,
      currentUsage,
      limit,
      resetsAt,
    });
  };

  const closeLimitModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  return {
    modalState,
    showLimitModal,
    closeLimitModal,
    setModalOpen: (open: boolean) => setModalState((prev) => ({ ...prev, open })),
  };
}
