import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';

export interface UseDataFetchOptions<T> {
  /** Initial data value */
  initialData?: T | null;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom success handler */
  onSuccess?: (data: T) => void;
  /** Whether to show error toast */
  showErrorToast?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Retry configuration */
  retry?: {
    count: number;
    delay: number;
  };
  /** Whether this is a mock implementation */
  isMock?: boolean;
  /** Mock delay in ms (only used when isMock is true) */
  mockDelay?: number;
}

export interface UseDataFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
  retry: () => void;
}

/**
 * Generic data fetching hook that standardizes loading, error handling, and data management
 * @param fetchFn - The async function that fetches the data
 * @param deps - Dependencies array for useEffect
 * @param options - Configuration options
 */
export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseDataFetchOptions<T> = {}
): UseDataFetchResult<T> {
  const {
    initialData = null,
    fetchOnMount = true,
    onError,
    onSuccess,
    showErrorToast = true,
    errorMessage = 'Failed to load data',
    retry: retryConfig = { count: 0, delay: 1000 },
    isMock = false,
    mockDelay = 500,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      // Add mock delay if specified
      if (isMock && mockDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, mockDelay));
      }

      const result = await fetchFn();

      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !controller.signal.aborted) {
        setData(result);
        setError(null);

        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      // Only handle error if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !controller.signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : errorMessage;

        setError(errorMsg);
        setData(null);

        if (showErrorToast) {
          toast.error(errorMsg);
        }

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMsg));
        } else {
          handleError(err, { fetchFn: fetchFn.toString() }, errorMessage);
        }

        // Handle retry logic
        if (retryConfig.count > 0 && retryCount < retryConfig.count) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryConfig.delay);
        }
      }
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [
    fetchFn,
    isMock,
    mockDelay,
    errorMessage,
    showErrorToast,
    onSuccess,
    onError,
    retryCount,
    retryConfig,
  ]);

  // Retry function
  const retry = useCallback(() => {
    setRetryCount(0);
    fetchData();
  }, [fetchData]);

  // Refetch function (alias for fetchData)
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Effect to fetch data on mount or when dependencies change
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }

    return () => {
      // Cleanup
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [...deps, retryCount]);

  // Keep track of mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
    retry,
  };
}

// For Supabase queries, users can create their own fetch functions like:
// const fetchUsers = async () => {
//   const { data, error } = await supabase.from('users').select('*');
//   if (error) throw error;
//   return data || [];
// };
// const { data, isLoading, error } = useDataFetch(fetchUsers, []);
