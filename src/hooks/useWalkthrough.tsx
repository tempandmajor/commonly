import { create } from 'zustand';

interface WalkthroughState {
  hasSeenOnboarding: boolean;
  isOnboardingActive: boolean;
  currentOnboardingStep: number;
  recentLogin: boolean;
  setRecentLogin: (value: boolean) => void;
  startOnboarding: () => void;
  dismissOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  isWalkthroughActive: boolean;
  currentStep: number;
  startWalkthrough: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endWalkthrough: () => void;
  hasCompletedWalkthrough: boolean;
}

// Create a no-op implementation of the walkthrough hook
export const useWalkthrough = create<WalkthroughState>(() => ({
  hasSeenOnboarding: true, // Set to true to prevent initial walkthrough
  isOnboardingActive: false,
  currentOnboardingStep: 0,
  recentLogin: false,
  hasCompletedWalkthrough: true,
  isWalkthroughActive: false,
  currentStep: 0,

  // All methods are no-ops
  setRecentLogin: () => {},
  startOnboarding: () => {},
  startWalkthrough: () => {},
  dismissOnboarding: () => {},
  endWalkthrough: () => {},
  completeOnboarding: () => {},
  resetOnboarding: () => {},
  goToNextStep: () => {},
  nextStep: () => {},
  goToPreviousStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
}));
