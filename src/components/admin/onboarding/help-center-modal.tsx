"use client";

import { useTranslations } from "next-intl";
import { BookOpen, RotateCcw, CheckSquare, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnboarding } from "./onboarding-provider";
import { OnboardingChecklist } from "./onboarding-checklist";
import { cn } from "@/lib/utils";

interface HelpCenterModalProps {
  primaryColor?: string | null;
}

export function HelpCenterModal({ primaryColor }: HelpCenterModalProps) {
  const { state, actions } = useOnboarding();
  const t = useTranslations();

  const handleRestartTour = () => {
    actions.setHelpOpen(false);
    // Small delay to let modal close before starting tour
    setTimeout(() => {
      actions.resetTour();
    }, 200);
  };

  return (
    <Dialog open={state.isHelpOpen} onOpenChange={actions.setHelpOpen}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen
              className="h-5 w-5"
              style={primaryColor ? { color: primaryColor } : undefined}
            />
            {t("onboarding.helpCenter.title")}
          </DialogTitle>
          <DialogDescription>
            {t("onboarding.helpCenter.description")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="guide" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guide" className="text-xs sm:text-sm">
              <Info className="h-4 w-4 mr-1 hidden sm:inline" />
              {t("onboarding.helpCenter.tabs.guide")}
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs sm:text-sm">
              <CheckSquare className="h-4 w-4 mr-1 hidden sm:inline" />
              {t("onboarding.helpCenter.tabs.checklist")}
            </TabsTrigger>
            <TabsTrigger value="sections" className="text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />
              {t("onboarding.helpCenter.tabs.sections")}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Getting Started */}
            <TabsContent value="guide" className="mt-0 space-y-4">
              <div className="prose prose-sm dark:prose-invert">
                <h4 className="font-semibold mb-2">
                  {t("onboarding.helpCenter.guide.welcome")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {t("onboarding.helpCenter.guide.intro")}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">
                  {t("onboarding.helpCenter.guide.quickStart")}
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>{t("onboarding.helpCenter.guide.step1")}</li>
                  <li>{t("onboarding.helpCenter.guide.step2")}</li>
                  <li>{t("onboarding.helpCenter.guide.step3")}</li>
                  <li>{t("onboarding.helpCenter.guide.step4")}</li>
                </ol>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleRestartTour}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("onboarding.helpCenter.restartTour")}
              </Button>
            </TabsContent>

            {/* Checklist */}
            <TabsContent value="checklist" className="mt-0">
              <OnboardingChecklist
                primaryColor={primaryColor}
                onNavigate={() => actions.setHelpOpen(false)}
              />
            </TabsContent>

            {/* Section Guide */}
            <TabsContent value="sections" className="mt-0 space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {/* Navigation & Account */}
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("onboarding.helpCenter.navigationLabel") || "Navigation"}
              </div>
              <SectionCard
                title={t("onboarding.helpCenter.sections.companySwitcher.title")}
                description={t("onboarding.helpCenter.sections.companySwitcher.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.myAppointments.title")}
                description={t("onboarding.helpCenter.sections.myAppointments.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.adminLink.title")}
                description={t("onboarding.helpCenter.sections.adminLink.description")}
                primaryColor={primaryColor}
              />

              {/* Admin Panel Sections */}
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                {t("onboarding.helpCenter.adminSectionsLabel") || "Admin Panel"}
              </div>
              <SectionCard
                title={t("onboarding.helpCenter.sections.dashboard.title")}
                description={t("onboarding.helpCenter.sections.dashboard.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.services.title")}
                description={t("onboarding.helpCenter.sections.services.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.workingHours.title")}
                description={t("onboarding.helpCenter.sections.workingHours.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.appointments.title")}
                description={t("onboarding.helpCenter.sections.appointments.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.invoices.title")}
                description={t("onboarding.helpCenter.sections.invoices.description")}
                primaryColor={primaryColor}
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.conversations.title")}
                description={t("onboarding.helpCenter.sections.conversations.description")}
                primaryColor={primaryColor}
                isPro
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.documents.title")}
                description={t("onboarding.helpCenter.sections.documents.description")}
                primaryColor={primaryColor}
                isPro
              />
              <SectionCard
                title={t("onboarding.helpCenter.sections.settings.title")}
                description={t("onboarding.helpCenter.sections.settings.description")}
                primaryColor={primaryColor}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface SectionCardProps {
  title: string;
  description: string;
  primaryColor?: string | null;
  isPro?: boolean;
}

function SectionCard({ title, description, primaryColor, isPro }: SectionCardProps) {
  const t = useTranslations();
  return (
    <div className={cn("p-3 rounded-lg border", isPro && "border-dashed")}>
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-medium text-sm">{title}</h4>
        {isPro && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={
              primaryColor
                ? { backgroundColor: primaryColor, color: "white" }
                : { backgroundColor: "hsl(var(--primary))", color: "white" }
            }
          >
            {t("onboarding.helpCenter.proBadge")}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
