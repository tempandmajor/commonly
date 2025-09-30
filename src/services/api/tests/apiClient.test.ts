import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../client/apiClient';
import {
  ApiError,
  ApiErrorType,
  ApiClientConfig,
  RequestInterceptor,
  DataResponseInterceptor,
} from '../core/types';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast
vi.mock('sonner', () => {
  return {
    toast: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    // Create a new API client for each test
    apiClient = new ApiClient({
      baseUrl: 'https://api.example.com',
      defaultHeaders: {
        'Content-Type': 'application/json',
        'X-Test-Header': 'test-value',
      },
    });

    // Reset mock fetch
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('request methods', () => {
    it('should make a GET request', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ data: 'test data' }),
      });

      const response = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );

      expect(response.data).toEqual({ data: 'test data' });
      expect(response.meta.status).toBe(200);
      expect(response.meta.ok).toBe(true);
    });

    it('should make a POST request with JSON body', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ id: 123 }),
      });

      const body = { name: 'Test', value: 42 };
      const response = await apiClient.post('/test', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(body),
        })
      );

      expect(response.data).toEqual({ id: 123 });
      expect(response.meta.status).toBe(201);
    });

    it('should make a PUT request', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ updated: true }),
      });

      const body = { name: 'Updated' };
      const response = await apiClient.put('/test/123', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test/123',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.any(Headers),
          body: JSON.stringify(body),
        })
      );

      expect(response.data).toEqual({ updated: true });
      expect(response.meta.status).toBe(200);
    });

    it('should make a DELETE request', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers({}),
        json: async () => ({}),
      });

      const response = await apiClient.delete('/test/123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test/123',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.any(Headers),
        })
      );

      expect(response.meta.status).toBe(204);
    });
  });

  describe('error handling', () => {
    it('should handle client errors (4xx)', async () => {
      // Mock 404 response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ error: 'Resource not found' }),
      });

      await expect(apiClient.get('/nonexistent')).rejects.toThrow();

      // Mock again for the second call in try/catch
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ error: 'Resource not found' }),
      });

      try {
        await apiClient.get('/nonexistent');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).type).toBe(ApiErrorType.CLIENT_ERROR);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('should handle server errors (5xx)', async () => {
      // Mock 500 response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ error: 'Server error' }),
      });

      await expect(apiClient.get('/error')).rejects.toThrow();

      // Mock again for the second call in try/catch
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ error: 'Server error' }),
      });

      try {
        await apiClient.get('/error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).type).toBe(ApiErrorType.SERVER_ERROR);
        expect((error as ApiError).status).toBe(500);
      }
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow();

      try {
        await apiClient.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Network error');
      }
    });
  });

  describe('caching', () => {
    it('should cache GET requests when enabled', async () => {
      // Create client with caching enabled
      const cachingClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        useCache: true,
        cacheTtl: 60000, // 1 minute
      });

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ data: 'cached data' }),
      });

      // First call should hit the network
      const response1 = await cachingClient.get('/cached');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response1.data).toEqual({ data: 'cached data' });
      expect(response1.meta.fromCache).toBeUndefined();

      // Second call should use cache
      const response2 = await cachingClient.get('/cached');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only called once
      expect(response2.data).toEqual({ data: 'cached data' });
      expect(response2.meta.fromCache).toBe(true);
    });

    it('should clear cache when requested', async () => {
      // Create client with caching enabled
      const cachingClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        useCache: true,
      });

      // Mock successful responses
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'first response' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'second response' }),
      });

      // First call
      await cachingClient.get('/test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      cachingClient.clearCache();

      // Second call should hit network again
      await cachingClient.get('/test');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('request configuration', () => {
    it('should merge default and custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({}),
        json: async () => ({}),
      });

      await apiClient.get('/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
          // This should override the default
          'X-Test-Header': 'override-value',
        },
      });

      // Verify headers were merged correctly
      const call = mockFetch.mock.calls[0];
      const requestHeaders = call[1].headers;

      expect(requestHeaders.get('Content-Type')).toBe('application/json');
      expect(requestHeaders.get('X-Custom-Header')).toBe('custom-value');
      expect(requestHeaders.get('X-Test-Header')).toBe('override-value');
    });
  });

  describe('interceptors', () => {
    it('should apply request interceptors', async () => {
      // Create mock interceptor
      const requestInterceptor: RequestInterceptor = vi.fn((url, options) => {
        const headers =
          options.headers instanceof Headers ? options.headers : new Headers(options.headers);
        headers.set('X-Intercepted', 'true');
        headers.set('Authorization', 'Bearer test-token');
        return { url, options: { ...options, headers } };
      });

      // Create client with interceptor
      const interceptorClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        requestInterceptors: [requestInterceptor],
      } as ApiClientConfig);

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({}),
        json: async () => ({}),
      });

      await interceptorClient.get('/test');

      // Verify interceptor was called
      expect(requestInterceptor).toHaveBeenCalled();

      // Verify headers were added by interceptor
      const call = mockFetch.mock.calls[0];
      const requestHeaders = call[1].headers;

      expect(requestHeaders.get('X-Intercepted')).toBe('true');
      expect(requestHeaders.get('Authorization')).toBe('Bearer test-token');
    });

    it('should apply data response interceptors (post-parse)', async () => {
      // Create mock data response interceptor
      const dataResponseInterceptor: DataResponseInterceptor = vi.fn(apiResponse => {
        return {
          ...apiResponse,
          data: ...apiResponse.data || {}),
            intercepted: true,
            timestamp: 'test-timestamp',
          },
        };
      });

      // Create client with interceptor
      const interceptorClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        dataResponseInterceptors: [dataResponseInterceptor],
      } as ApiClientConfig);

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ original: 'data' }),
      });

      const response = await interceptorClient.get('/test');

      // Verify interceptor was called
      expect(dataResponseInterceptor).toHaveBeenCalled();

      // Verify data was modified by interceptor
      expect(response.data).toEqual({
        original: 'data',
        intercepted: true,
        timestamp: 'test-timestamp',
      });
    });

    it('should apply multiple interceptors in order', async () => {
      // Create mock interceptors
      const requestInterceptor1: RequestInterceptor = vi.fn((url, options) => {
        const headers =
          options.headers instanceof Headers ? options.headers : new Headers(options.headers);
        headers.set('X-Order', '1');
        return { url, options: { ...options, headers } };
      });

      const requestInterceptor2: RequestInterceptor = vi.fn((url, options) => {
        const headers =
          options.headers instanceof Headers ? options.headers : new Headers(options.headers);
        const currentOrder = headers.get('X-Order');
        headers.set('X-Order', `${currentOrder},2`);
        return { url, options: { ...options, headers } };
      });

      // Create client with multiple interceptors
      const interceptorClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        requestInterceptors: [requestInterceptor1, requestInterceptor2],
      } as ApiClientConfig);

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({}),
        json: async () => ({}),
      });

      await interceptorClient.get('/test');

      // Verify both interceptors were called in order
      expect(requestInterceptor1).toHaveBeenCalled();
      expect(requestInterceptor2).toHaveBeenCalled();

      // Verify headers reflect the order of interceptor execution
      const call = mockFetch.mock.calls[0];
      const requestHeaders = call[1].headers;

      expect(requestHeaders.get('X-Order')).toBe('1,2');
    });
  });

  describe('performance monitoring', () => {
    it('should track request duration', async () => {
      // Mock the performance API
      const originalPerformance = global.performance;
      const mockPerformance = {
        now: vi.fn(),
      };

      // First call for start time, second for end time
      mockPerformance.now.mockReturnValueOnce(1000);
      mockPerformance.now.mockReturnValueOnce(1500);

      global.performance = mockPerformance as any;

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ data: 'test' }),
      });

      const response = await apiClient.get('/test');

      // Restore original performance API
      global.performance = originalPerformance;

      // Verify duration was calculated correctly (1500 - 1000 = 500ms)
      expect(response.meta.duration).toBe(500);
    });
  });

  describe('retry logic', () => {
    it('should retry failed requests according to retry config', async () => {
      // Create client with retry configuration
      const retryClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        retryConfig: {
          maxRetries: 3,
          retryDelay: 10, // Small delay for tests
          retryBackoff: 2,
          retryCondition: error => error.status === 503,
        },
      });

      // First two calls fail with 503 Service Unavailable
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({}),
        json: async () => ({ error: 'Service unavailable' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({}),
        json: async () => ({ error: 'Service unavailable' }),
      });

      // Third call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ data: 'success after retry' }),
      });

      const response = await retryClient.get('/retry-test');

      // Should have been called 3 times (initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(response.data).toEqual({ data: 'success after retry' });
    });

    it('should stop retrying after max retries', async () => {
      // Create client with retry configuration
      const retryClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        retryConfig: {
          maxRetries: 2,
          retryDelay: 10,
          retryCondition: error => error.status === 500,
        },
      });

      // All calls fail with 500 Server Error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: new Headers({}),
        json: async () => ({ error: 'Server error' }),
      });

      await expect(retryClient.get('/retry-test')).rejects.toThrow();

      // Should have been called 3 times (initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);

      try {
        await retryClient.get('/retry-test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).type).toBe(ApiErrorType.SERVER_ERROR);
      }
    });

    it('should not retry if condition is not met', async () => {
      // Create client with retry configuration that only retries on 503
      const retryClient = new ApiClient({
        baseUrl: 'https://api.example.com',
        retryConfig: {
          maxRetries: 2,
          retryDelay: 10,
          retryCondition: error => error.status === 503,
        },
      });

      // Call fails with 400 Bad Request (not matching retry condition)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({}),
        json: async () => ({ error: 'Bad request' }),
      });

      await expect(retryClient.get('/retry-test')).rejects.toThrow();

      // Should have been called only once (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
