"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { tourSteps } from "./tour-config";
import {
  useOnboardingState,
  type OnboardingState,
  type OnboardingActions,
} from "./use-onboarding";

interface OnboardingContextType {
  state: OnboardingState;
  actions: OnboardingActions;
  totalSteps: number;
}

const defaultState: OnboardingState = {
  isTourActive: false,
  currentStepIndex: 0,
  hasCompletedTour: false,
  isHelpOpen: false,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const totalSteps = tourSteps.length;

  const { state, actions, mounted } = useOnboardingState(companySlug, totalSteps);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state: mounted ? state : defaultState,
      actions,
      totalSteps,
    }),
    [mounted, state, actions, totalSteps]
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}
