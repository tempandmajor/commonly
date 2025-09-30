import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  CacheType,
  getCacheProvider,
  createCache,
  CacheStorage,
  CacheProvider,
} from '@/utils/cache';

// Get or create the form drafts cache
const getFormDraftsCache = <T extends object>(): CacheProvider<T> => {
  let cache = getCacheProvider<T>(CacheType.FORM_DRAFTS);

  if (!cache) {
    cache = createCache<T>(CacheType.FORM_DRAFTS, CacheStorage.LOCAL_STORAGE);
  }

  return cache;
};

export function useFormDraft<T extends object>(
  form: UseFormReturn<T>,
  draftKey: string,
  enabled: boolean = true
) {
  // Save form values to cache whenever they change
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(values => {
      try {
        // Handle Date objects before stringifying
        const processedValues = Object.entries(values).reduce((acc, [key, value]) => {
          // Skip undefined values
          if (value === undefined) return acc;

          // Process Date objects
          if (value instanceof Date) {
            acc[key as keyof T] = value.toISOString() as unknown;
          } else {
            acc[key as keyof T] = value;
          }
          return acc;
        }, {} as T);

        const cache = getFormDraftsCache<T>();
        cache.set(draftKey, processedValues);
      } catch (_error) {
        // Error handling silently ignored
      }
    });

    return () => subscription.unsubscribe();
  }, [form, draftKey, enabled]);

  // Load saved draft on initial render
  useEffect(() => {
    if (!enabled) return;

    try {
      const cache = getFormDraftsCache<T>();
      const savedDraft = cache.get(draftKey);

      if (savedDraft) {
        // Handle date fields by converting string dates back to Date objects
        const processedDraft = Object.entries(savedDraft).reduce((acc, [key, value]) => {
          // Check if the value is a date string format (simple check)
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            acc[key as keyof T] = new Date(value) as unknown;
          } else {
            acc[key as keyof T] = value as unknown;
          }
          return acc;
        }, {} as T);

        form.reset(processedDraft);
      }
    } catch (_error) {
      // Error handling silently ignored
    }
  }, [form, draftKey, enabled]);

  // Function to clear the draft
  const clearDraft = () => {
    const cache = getFormDraftsCache<T>();
    cache.remove(draftKey);
  };

  return { clearDraft };
}
