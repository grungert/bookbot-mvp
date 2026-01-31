"use client";

import { useCallback, useEffect, useState } from "react";

const TOUR_COMPLETED_KEY = "admin-tour-completed";
const TOUR_STEP_KEY = "admin-tour-step";

export interface OnboardingState {
  isTourActive: boolean;
  currentStepIndex: number;
  hasCompletedTour: boolean;
  isHelpOpen: boolean;
}

export interface OnboardingActions {
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setHelpOpen: (open: boolean) => void;
  resetTour: () => void;
}

export function useOnboardingState(companySlug: string, totalSteps: number) {
  const [state, setState] = useState<OnboardingState>({
    isTourActive: false,
    currentStepIndex: 0,
    hasCompletedTour: false,
    isHelpOpen: false,
  });
  const [mounted, setMounted] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const completedKey = `${TOUR_COMPLETED_KEY}-${companySlug}`;
    const stepKey = `${TOUR_STEP_KEY}-${companySlug}`;

    const completed = localStorage.getItem(completedKey) === "true";
    const savedStep = parseInt(localStorage.getItem(stepKey) || "0", 10);

    setState((prev) => ({
      ...prev,
      hasCompletedTour: completed,
      currentStepIndex: savedStep,
      // Auto-start tour for first-time users
      isTourActive: !completed && savedStep === 0,
    }));
  }, [companySlug]);

  // Save step to localStorage
  const saveStep = useCallback(
    (step: number) => {
      localStorage.setItem(`${TOUR_STEP_KEY}-${companySlug}`, String(step));
    },
    [companySlug]
  );

  // Mark tour as completed
  const markCompleted = useCallback(() => {
    localStorage.setItem(`${TOUR_COMPLETED_KEY}-${companySlug}`, "true");
    localStorage.removeItem(`${TOUR_STEP_KEY}-${companySlug}`);
  }, [companySlug]);

  // Reset tour
  const resetTourStorage = useCallback(() => {
    localStorage.removeItem(`${TOUR_COMPLETED_KEY}-${companySlug}`);
    localStorage.setItem(`${TOUR_STEP_KEY}-${companySlug}`, "0");
  }, [companySlug]);

  const actions: OnboardingActions = {
    startTour: useCallback(() => {
      setState((prev) => ({
        ...prev,
        isTourActive: true,
        currentStepIndex: 0,
      }));
      saveStep(0);
    }, [saveStep]),

    nextStep: useCallback(() => {
      setState((prev) => {
        const nextIndex = prev.currentStepIndex + 1;
        if (nextIndex >= totalSteps) {
          markCompleted();
          return {
            ...prev,
            isTourActive: false,
            hasCompletedTour: true,
            currentStepIndex: 0,
          };
        }
        saveStep(nextIndex);
        return {
          ...prev,
          currentStepIndex: nextIndex,
        };
      });
    }, [totalSteps, saveStep, markCompleted]),

    prevStep: useCallback(() => {
      setState((prev) => {
        const prevIndex = Math.max(0, prev.currentStepIndex - 1);
        saveStep(prevIndex);
        return {
          ...prev,
          currentStepIndex: prevIndex,
        };
      });
    }, [saveStep]),

    skipTour: useCallback(() => {
      markCompleted();
      setState((prev) => ({
        ...prev,
        isTourActive: false,
        hasCompletedTour: true,
        currentStepIndex: 0,
      }));
    }, [markCompleted]),

    completeTour: useCallback(() => {
      markCompleted();
      setState((prev) => ({
        ...prev,
        isTourActive: false,
        hasCompletedTour: true,
        currentStepIndex: 0,
      }));
    }, [markCompleted]),

    setHelpOpen: useCallback((open: boolean) => {
      setState((prev) => ({
        ...prev,
        isHelpOpen: open,
      }));
    }, []),

    resetTour: useCallback(() => {
      resetTourStorage();
      setState((prev) => ({
        ...prev,
        isTourActive: true,
        hasCompletedTour: false,
        currentStepIndex: 0,
      }));
    }, [resetTourStorage]),
  };

  return { state, actions, mounted };
}
