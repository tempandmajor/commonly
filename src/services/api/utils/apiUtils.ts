/**
 * API Client Service - Utilities
 *
 * This file provides utility functions for common API operations.
 */

import { toast } from 'sonner';
import { ApiError } from '../core/types';
import { appClient } from '../client/clients';

/**
 * Adds query parameters to a URL
 *
 * @param url - Base URL
 * @param params - Query parameters object
 * @returns URL with query parameters
 */
export function addQueryParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;

  const urlObj = new URL(url.startsWith('http') ? url : `http://domain.com${url}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlObj.searchParams.append(key, String(value));
    }
  });

  return url.startsWith('http') ? urlObj.toString() : `${urlObj.pathname}${urlObj.search}`;
}

/**
 * Performs a paginated API request
 *
 * @param url - Base URL for the API request
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @param additionalParams - Additional query parameters
 * @returns Promise with paginated data
 */
export async function fetchPaginatedData<T>(
  url: string,
  page: number = 1,
  pageSize: number = 10,
  additionalParams: Record<string, unknown> = {}
): Promise<{
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}> {
  const params = {
    page,
    limit: pageSize,
          ...additionalParams,
  };

  const urlWithParams = addQueryParams(url, params);

  try {
    const response = await appClient.get(urlWithParams);

    // Handle different API response formats
    if (response.data.items && response.data.meta) {
      // Format: { items: T[], meta: { ... } }
      return {
        data: response.data.items,
        meta: {
          currentPage: response.data.meta.currentPage || page,
          totalPages: response.data.meta.totalPages || 1,
          totalItems: response.data.meta.totalItems || response.data.items.length,
          pageSize: response.data.meta.pageSize || pageSize,
        },
      };
    } else if (Array.isArray(response.data.data)) {
      // Format: { data: T[], meta: { ... } }
      return {
        data: response.data.data,
        meta: {
          currentPage: response.data.meta?.currentPage || page,
          totalPages: response.data.meta?.totalPages || 1,
          totalItems: response.data.meta?.totalItems || response.data.data.length,
          pageSize: response.data.meta?.pageSize || pageSize,
        },
      };
    } else if (Array.isArray(response.data)) {
      // Format: T[]
      return {
        data: response.data,
        meta: {
          currentPage: page,
          totalPages: 1,
          totalItems: response.data.length,
          pageSize: pageSize,
        },
      };
    }

    // Default format
    return {
      data: [],
      meta: {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        pageSize: pageSize,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Performs a batch operation (multiple requests in parallel)
 *
 * @param requests - Array of request functions that return promises
 * @param options - Batch operation options
 * @returns Promise with array of results
 */
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  options: {
    maxConcurrent?: number;
    stopOnError?: boolean;
    timeout?: number;
  } = {}
): Promise<(T | Error)[]> {
  const { maxConcurrent = 5, stopOnError = false, timeout = 30000 } = options;

  const results: (T | Error)[] = new Array(requests.length);
  let currentIndex = 0;

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    if (timeout > 0) {
      setTimeout(() => reject(new Error('Batch request timeout')), timeout);
    }
  });

  // Process batch of requests concurrently
  const processBatch = async (): Promise<void> => {
    const batch = [];

    // Create promises for current batch
    while (batch.length < maxConcurrent && currentIndex < requests.length) {
      const index = currentIndex++;

      const requestPromise = (async () => {
        try {
          const result = await requests[index]();
          results[index] = result;
          return { index, error: null };
        } catch (error) {
          results[index] = error instanceof Error ? error : new Error(String(error));
          return { index, error: results[index] };
        }
      })();

      batch.push(requestPromise);
    }

    // Execute current batch
    if (batch.length > 0) {
      const batchResults = await Promise.all(batch);

      // Check if we need to stop on error
      if (stopOnError && batchResults.some(result => result.error)) {
        throw new Error('Batch operation failed with an error');
      }
    }
  };

  try {
    // Process all batches
    while (currentIndex < requests.length) {
      await Promise.race([processBatch(), timeoutPromise]);
    }

    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Creates a debounced API request function
 *
 * @param requestFn - Function that returns a promise
 * @param delayMs - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounceRequest<T, A extends any[]>(
  requestFn: (...args: A) => Promise<T>,
  delayMs: number = 300
): (...args: A) => Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: T) => void) | null = null;
  let latestReject: ((reason: unknown) => void) | null = null;
  let latestArgs: A | null = null;

  return (...args: A): Promise<T> => {
    latestArgs = args;

    return new Promise<T>((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const savedArgs = latestArgs;
        const savedResolve = latestResolve;
        const savedReject = latestReject;

        timeoutId = null;
        latestResolve = null;
        latestReject = null;

        if (savedArgs && savedResolve && savedReject) {
          requestFn(...savedArgs)
            .then(savedResolve)
            .catch(savedReject);
        }
      }, delayMs);
    });
  };
}

/**
 * Handles API errors in a standardized way
 *
 * @param error - Error object to handle
 * @param options - Error handling options
 * @returns Formatted error message
 */
export function handleApiError(
  error: unknown,
  options: {
    showToast?: boolean;
    defaultMessage?: string;
    logError?: boolean;
  } = {}
): string {
  const {
    showToast = true,
    defaultMessage = 'An unexpected error occurred',
    logError = true,
  } = options;

  // Extract the error
  const apiError = error instanceof ApiError ? error : ApiError.from(error);

  // Determine message based on error type
  let message: string;

  switch (apiError.type) {
    case 'network_error':
      message = 'Network error. Please check your connection.';
      break;

    case 'timeout_error':
      message = 'Request timed out. Please try again.';
      break;

    case 'server_error':
      message = apiError.status ? `Server error (${apiError.status})` : 'Server error';
      break;

    case 'client_error':
      if (apiError.status === 401) {
        message = 'Authentication required. Please log in.';
      } else if (apiError.status === 403) {
        message = "You don't have permission to access this resource.";
      } else if (apiError.status === 404) {
        message = 'Resource not found.';
      } else {
        message = apiError.message || `Request error (${apiError.status})`;
      }
      break;

    default:
      // Try to extract message from error response
      try {
        if (apiError.response) {
          const responseData = apiError.response.json?.() || {};
          message = responseData.message || responseData.error || apiError.message;
        } else {
          message = apiError.message;
        }
      } catch {
        message = apiError.message;
      }

      if (!message) {
        message = defaultMessage;
      }
  }

  // Log error if needed
  if (logError) {
  }

  // Show toast if needed
  if (showToast) {
    toast.error(message);
  }

  return message;
}

/**
 * Creates form data from an object
 *
 * @param data - Object to convert to FormData
 * @returns FormData instance
 */
export function createFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File) {
          formData.append(`${key}[${index}]`, item);
        } else if (typeof item === 'object' && item !== null) {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        } else if (item !== undefined && item !== null) {
          formData.append(`${key}[${index}]`, String(item));
        }
      });
    } else if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}
