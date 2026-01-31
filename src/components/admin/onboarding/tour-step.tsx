"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TourStep as TourStepConfig } from "./tour-config";

interface TourStepProps {
  step: TourStepConfig;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  primaryColor?: string | null;
}

export function TourStep({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  primaryColor,
}: TourStepProps) {
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const target = document.querySelector(step.targetSelector);
    if (!target || !popoverRef.current) return;

    const rect = target.getBoundingClientRect();
    setTargetRect(rect);

    const popoverRect = popoverRef.current.getBoundingClientRect();
    const padding = 12;
    const viewportPadding = 16;

    let top = 0;
    let left = 0;

    switch (step.position || "right") {
      case "right":
        top = rect.top + rect.height / 2 - popoverRect.height / 2;
        left = rect.right + padding;
        break;
      case "left":
        top = rect.top + rect.height / 2 - popoverRect.height / 2;
        left = rect.left - popoverRect.width - padding;
        break;
      case "top":
        top = rect.top - popoverRect.height - padding;
        left = rect.left + rect.width / 2 - popoverRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - popoverRect.width / 2;
        break;
    }

    // Ensure popover stays within viewport
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverRect.height - viewportPadding));
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverRect.width - viewportPadding));

    setPosition({ top, left });
  }, [step.targetSelector, step.position]);

  useEffect(() => {
    // Initial position update
    const timer = setTimeout(updatePosition, 100);

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex > 0) onPrev();
          break;
        case "Escape":
          e.preventDefault();
          onSkip();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, onSkip, currentIndex]);

  const isLastStep = currentIndex === totalSteps - 1;
  const isFirstStep = currentIndex === 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/50" onClick={onSkip} />

      {/* Spotlight on target element */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "8px",
          }}
        />
      )}

      {/* Popover */}
      <div
        ref={popoverRef}
        className={cn(
          "fixed z-[10000] w-80 rounded-lg border bg-background p-4 shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {totalSteps}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onSkip}
            aria-label={tCommon("close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <h3
          id="tour-step-title"
          className="font-semibold mb-2"
          style={primaryColor ? { color: primaryColor } : undefined}
        >
          {t(step.titleKey)}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t(step.contentKey)}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            {t("onboarding.tour.skip")}
          </Button>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={onNext}
              style={
                primaryColor
                  ? { backgroundColor: primaryColor, color: "white" }
                  : undefined
              }
            >
              {isLastStep ? t("onboarding.tour.finish") : tCommon("next")}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
