"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "./onboarding-provider";
import { tourSteps } from "./tour-config";
import { TourStep } from "./tour-step";

interface OnboardingTourProps {
  primaryColor?: string | null;
}

export function OnboardingTour({ primaryColor }: OnboardingTourProps) {
  const { state, actions, totalSteps } = useOnboarding();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't show tour on mobile (sidebar is hidden)
  if (!state.isTourActive || isMobile) {
    return null;
  }

  const currentStep = tourSteps[state.currentStepIndex];
  if (!currentStep) {
    return null;
  }

  return (
    <TourStep
      step={currentStep}
      currentIndex={state.currentStepIndex}
      totalSteps={totalSteps}
      onNext={actions.nextStep}
      onPrev={actions.prevStep}
      onSkip={actions.skipTour}
      primaryColor={primaryColor}
    />
  );
}
