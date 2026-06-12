"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "veild_onboarding_done";

export type OnboardingStep = "welcome" | "wallet" | "explore" | "send" | "done";

const STEPS: OnboardingStep[] = ["welcome", "wallet", "explore", "send", "done"];

export function useOnboarding() {
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (typeof window === "undefined") return "welcome";
    return localStorage.getItem(STORAGE_KEY) ? "done" : "welcome";
  });

  const currentIndex = STEPS.indexOf(step);
  const isComplete   = step === "done";

  const next = useCallback(() => {
    setStep((s) => {
      const idx  = STEPS.indexOf(s);
      const next = STEPS[Math.min(idx + 1, STEPS.length - 1)];
      if (next === "done") localStorage.setItem(STORAGE_KEY, "1");
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setStep("done");
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStep("welcome");
  }, []);

  return {
    step,
    currentIndex,
    totalSteps: STEPS.length - 1,
    isComplete,
    next,
    skip,
    reset,
  };
}
