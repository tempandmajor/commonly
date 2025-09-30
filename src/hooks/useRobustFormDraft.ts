import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export interface FormDraftOptions<T> {
  /**
   * Storage key for the draft
   */
  draftKey: string;
  /**
   * Form instance from react-hook-form
   */
  form: UseFormReturn<T>;
  /**
   * Enable or disable draft functionality
   */
  enabled?: boolean;
  /**
   * Debounce time in milliseconds
   */
  debounceMs?: number;
  /**
   * Draft expiration time in milliseconds
   */
  expirationMs?: number;
  /**
   * Fields to exclude from draft
   */
  excludeFields?: string[];
  /**
   * Callback when draft is loaded
   */
  onDraftLoaded?: (draft: T) => void;
  /**
   * Callback when draft is saved
   */
  onDraftSaved?: (draft: T) => void;
  /**
   * Callback when draft is cleared
   */
  onDraftCleared?: () => void;
}

export function useRobustFormDraft<T extends object>({
  draftKey,
  form,
  enabled = true,
  debounceMs = 500,
  expirationMs = 7 * 24 * 60 * 60 * 1000, // 7 days
  excludeFields = [],
  onDraftLoaded,
  onDraftSaved,
  onDraftCleared,
}: FormDraftOptions<T>) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

  // Load draft on initial render
  useEffect(() => {
    if (!enabled) return;

    try {
      const savedDraftJSON = localStorage.getItem(draftKey);

      if (!savedDraftJSON) {
        return;
      }

      const { data, timestamp } = JSON.parse(savedDraftJSON) as any;

      // Check if draft has expired
      if (timestamp && Date.now() - timestamp > expirationMs) {
        localStorage.removeItem(draftKey);
        return;
      }

      // Convert date strings back to Date objects
      const processedData = processFormData(data, true);

      // Reset form with loaded draft
      form.reset(processedData);
      setHasDraft(true);
      setLastSaved(new Date(timestamp));

      if (onDraftLoaded) {
        onDraftLoaded(processedData);
      }
    } catch (error) {}
  }, [draftKey, form, enabled, expirationMs, onDraftLoaded]);

  // Process form data for storage or loading
  const processFormData = (data: unknown, isLoading = false): T => {
    return Object.entries(data).reduce((acc, [key, value]) => {
      // Skip excluded fields
      if (excludeFields.includes(key)) {
        return acc;
      }

      if (value === undefined || value === null) {
        return acc;
      }

      // Handle Date objects
      if (isLoading && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        acc[key as keyof T] = new Date(value) as unknown;
      } else if (!isLoading && value instanceof Date) {
        acc[key as keyof T] = value.toISOString() as unknown;
      } else {
        acc[key as keyof T] = value as unknown;
      }

      return acc;
    }, {} as T);
  };

  // Save draft as form values change
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(values => {
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        try {
          const processedValues = processFormData(values);

          // Skip saving if all values are empty
          const hasValues = (Object.keys(processedValues) as (keyof typeof processedValues)[]).length > 0;
          if (!hasValues) return;

          const draftData = {
            data: processedValues,
            timestamp: Date.now(),
          };

          localStorage.setItem(draftKey, JSON.stringify(draftData));
          setHasDraft(true);
          setLastSaved(new Date());

          if (onDraftSaved) {
            onDraftSaved(processedValues);
          }
        } catch (error) {}
      }, debounceMs);

      setDebounceTimeout(timeoutId);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }
    };
  }, [form, draftKey, enabled, debounceMs, onDraftSaved]);

  // Function to clear the draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setLastSaved(null);
      form.reset({} as T);

      if (onDraftCleared) {
        onDraftCleared();
      }
    } catch (error) {}
  };

  return {
    hasDraft,
    lastSaved,
    clearDraft,
  };
}
