import { useState, useEffect, useCallback } from 'react';

const PROMPT_INTERVAL_KEY = 'location_prompt_interval';
const DEFAULT_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useLocationPrompt = () => {
  const [customPromptShown, setCustomPromptShown] = useState(false);

  // Check if we should show the prompt based on time elapsed
  const shouldShowLocationPrompt = useCallback(() => {
    try {
      const lastPromptTime = localStorage.getItem(PROMPT_INTERVAL_KEY);

      if (!lastPromptTime) {
        return true; // No record of previous prompt, should show
      }

      const parsedTime = parseInt(lastPromptTime, 10);
      if (isNaN(parsedTime)) {
        return true; // Invalid time, should show
      }

      const now = Date.now();
      const timeSinceLastPrompt = now - parsedTime;

      // If enough time has passed since last prompt, show again
      return timeSinceLastPrompt > DEFAULT_INTERVAL;
    } catch (error) {
      return false; // On error, don't show to avoid potential spam
    }
  }, []);

  // Update the last prompt time to now
  const updateLastPromptTime = useCallback(() => {
    try {
      localStorage.setItem(PROMPT_INTERVAL_KEY, Date.now().toString());
    } catch (_error) {
      // Error handling silently ignored
    }
  }, []);

  // Check on first render if we should show the prompt
  useEffect(() => {
    const userHasInteracted = sessionStorage.getItem('userHasInteracted');

    // Wait for user interaction before showing prompts
    const handleFirstInteraction = () => {
      sessionStorage.setItem('userHasInteracted', 'true');

      if (shouldShowLocationPrompt()) {
        setCustomPromptShown(true);
      }

      // Remove event listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    if (!userHasInteracted) {
      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };
    } else if (shouldShowLocationPrompt()) {
      // If user has interacted before, check if we should show prompt
      setCustomPromptShown(true);
    }
  }, [shouldShowLocationPrompt]);

  return {
    customPromptShown,
    setCustomPromptShown,
    shouldShowLocationPrompt,
    updateLastPromptTime,
  };
};
