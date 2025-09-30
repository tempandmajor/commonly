/**
 * API Client Service - React Hooks
 *
 * This file provides React hooks for making API requests with loading,
 * error, and data states managed automatically.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClient } from '../client/apiClient';
import { ApiError, ApiResponse, HttpMethod, RequestOptions } from '../core/types';
import { appClient } from '../client/clients';
import { addQueryParams } from '../utils';

/**
 * API state returned by hooks
 */
interface ApiState<T> {
  /** Response data */
  data: T | null;

  /** Whether a request is in progress */
  loading: boolean;

  /** Error if the request failed */
  error: ApiError | null;

  /** Response metadata */
  meta: {
    status?: number;
    headers?: Headers;
    fromCache?: boolean;
    duration?: number;
  };
}

/**
 * Common options for all API hooks
 */
interface ApiHookOptions {
  /** API client to use (defaults to appClient) */
  client?: ApiClient | undefined;

  /** Whether to make the request immediately on mount */
  immediate?: boolean | undefined;

  /** Dependencies to watch for changes and trigger a new request */
  dependencies?: unknown[] | undefined;

  /** Callback when the request succeeds */
  onSuccess?: (data: unknown) => void | undefined;

  /** Callback when the request fails */
  onError?: (error: ApiError) => void | undefined;

  /** Custom cache key */
  cacheKey?: string | undefined;

  /** Whether to skip the request */
  skip?: boolean | undefined;

  /** Request options */
  requestOptions?: RequestOptions | undefined;
}

/**
 * Core hook for API requests that handles state management
 */
function useApiBase<T = any, P = any>(
  options: ApiHookOptions = {}
): {
  state: ApiState<T>;
  setState: React.Dispatch<React.SetStateAction<ApiState<T>>>;
  isMountedRef: React.MutableRefObject<boolean>;
  handleRequest: (requestFn: () => Promise<ApiResponse<T>>, payload?: P) => Promise<ApiResponse<T>>;
} {
  const { immediate = false, skip = false, onSuccess, onError } = options;

  // Initialize state
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate && !skip,
    error: null,
    meta: {},
  });

  // Track component mount state
  const isMountedRef = useRef(true);

  // Generic request handler
  const handleRequest = useCallback(
    async (requestFn: () => Promise<ApiResponse<T>>, _payload?: P): Promise<ApiResponse<T>> => {
      // Skip if requested
      if (skip) {
        return Promise.reject(new Error('Request skipped'));
      }

      // Set loading state
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Execute the request
        const response = await requestFn();

        // Update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            meta: {
              status: response.status || response.meta.status,
              headers: response.headers || response.meta.headers,
              fromCache: response.meta.fromCache,
              duration: response.meta.duration,
            },
          });

          // Call success callback if provided
          if (onSuccess) {
            onSuccess(response.data);
          }
        }

        return response;
      } catch (error) {
        // Convert to ApiError if needed
        const apiError = error instanceof ApiError ? error : ApiError.from(error);

        // Update state if component is still mounted
        if (isMountedRef.current) {
          setState(prev => ({
          ...prev,
            loading: false,
            error: apiError,
            meta: {
              status: apiError.status,
              headers: apiError.response?.headers,
            },
          }));

          // Call error callback if provided
          if (onError) {
            onError(apiError);
          }
        }

        throw apiError;
      }
    },
    [skip, onSuccess, onError, isMountedRef, setState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { state, setState, isMountedRef, handleRequest };
}

/**
 * Hook for making GET requests
 */
export function useApiGet<T = any>(
  url: string,
  options: ApiHookOptions = {}
): [ApiState<T>, (params?: Record<string, unknown>) => Promise<ApiResponse<T>>, () => void] {
  const {
    client = appClient,
    immediate = true,
    dependencies = [],
    requestOptions,
    skip = false,
  } = options;

  // Use the base hook for state management
  const { state, handleRequest } = useApiBase<T>({
          ...options,
    immediate: false, // We'll handle this ourselves
  });

  // Store the latest params for refetching
  const paramsRef = useRef<Record<string, unknown> | undefined>(undefined);

  // Function to fetch data with parameters
  const fetchData = useCallback(
    async (params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
      // Store params for potential refetch
      paramsRef.current = params;

      // Create the URL with parameters
      const urlWithParams = params ? addQueryParams(url, params) : url;

      // Use the base handler to make the request
      return handleRequest(() => client.get<T>(urlWithParams, requestOptions), params);
    },
    [client, url, handleRequest, requestOptions]
  );

  // Function to refetch data using the same parameters
  const refetch = useCallback(() => {
    return fetchData(paramsRef.current);
  }, [fetchData]);

  // Effect to fetch data on mount and when dependencies change
  useEffect(() => {
    if (immediate && !skip) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, immediate, ...dependencies]);

  return [state, fetchData, refetch];
}

/**
 * Hook for making POST requests
 */
export function useApiPost<T = any, B = any>(
  url: string,
  options: ApiHookOptions = {}
): [ApiState<T>, (body: B) => Promise<ApiResponse<T>>] {
  const { client = appClient, requestOptions } = options;

  // Use the base hook for state management
  const { state, handleRequest } = useApiBase<T, B>(options);

  // Function to post data
  const postData = useCallback(
    async (body: B): Promise<ApiResponse<T>> => {
      return handleRequest(() => client.post<T>(url, body, requestOptions), body);
    },
    [client, url, handleRequest, requestOptions]
  );

  return [state, postData];
}

/**
 * Hook for general API requests
 */
export function useApiRequest<T = any, B = any>(
  method: HttpMethod,
  url: string,
  options: ApiHookOptions = {}
): [ApiState<T>, (body?: B) => Promise<ApiResponse<T>>] {
  const { client = appClient, requestOptions } = options;

  // Use the base hook for state management
  const { state, handleRequest } = useApiBase<T, B>(options);

  const makeRequest = useCallback(
    async (body?: B): Promise<ApiResponse<T>> => {
      return handleRequest(async () => {
        switch (method) {
          case HttpMethod.GET:
            return await client.get<T>(url, requestOptions);
          case HttpMethod.POST:
            return await client.post<T>(url, body, requestOptions);
          case HttpMethod.PUT:
            return await client.put<T>(url, body, requestOptions);
          case HttpMethod.PATCH:
            return await client.patch<T>(url, body, requestOptions);
          case HttpMethod.DELETE:
            return await client.delete<T>(url, body, requestOptions);
          default:
            return await client.request<T>(url, method, body, requestOptions);
        }
      }, body);
    },
    [client, method, url, handleRequest, requestOptions]
  );

  return [state, makeRequest];
}

/**
 * Hook for PUT requests
 */
export function useApiPut<T = any, B = any>(
  url: string,
  options: ApiHookOptions = {}
): [ApiState<T>, (body: B) => Promise<ApiResponse<T>>] {
  return useApiRequest<T, B>(HttpMethod.PUT, url, options);
}

/**
 * Hook for PATCH requests
 */
export function useApiPatch<T = any, B = any>(
  url: string,
  options: ApiHookOptions = {}
): [ApiState<T>, (body: B) => Promise<ApiResponse<T>>] {
  return useApiRequest<T, B>(HttpMethod.PATCH, url, options);
}

/**
 * Hook for DELETE requests
 */
export function useApiDelete<T = any, B = any>(
  url: string,
  options: ApiHookOptions = {}
): [ApiState<T>, (body?: B) => Promise<ApiResponse<T>>] {
  return useApiRequest<T, B>(HttpMethod.DELETE, url, options);
}
