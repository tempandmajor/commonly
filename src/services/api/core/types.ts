/**
 * API Client Service - Core Types
 *
 * This file defines the core types and interfaces for the API client service.
 */

/**
 * HTTP methods supported by the API client
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  /** HTTP headers to include with the request */
  headers?: Record<string, string> | undefined;

  /** Request timeout in milliseconds */
  timeout?: number | undefined;

  /** Whether to include credentials (cookies) with the request */
  withCredentials?: boolean | undefined;

  /** Whether to handle errors automatically */
  handleErrors?: boolean | undefined;

  /** Whether to parse the response as JSON */
  parseJson?: boolean | undefined;

  /** Whether to use cache for GET requests */
  useCache?: boolean | undefined;

  /** Cache time-to-live in milliseconds */
  cacheTtl?: number | undefined;

  /** Signal to abort the request */
  signal?: AbortSignal | undefined;
}

/**
 * API response metadata
 */
export interface ResponseMeta {
  /** HTTP status code */
  status: number;

  /** HTTP status text */
  statusText?: string | undefined;

  /** Response headers */
  headers: Headers;

  /** Whether the request was successful */
  ok?: boolean | undefined;

  /** Time taken for the request in milliseconds */
  duration?: number | undefined;

  /** Whether the response was from cache */
  fromCache?: boolean | undefined;

  /** URL of the request */
  url?: string | undefined;

  /** HTTP method used for the request */
  method?: HttpMethod | undefined;
}

/**
 * API response with data and metadata
 */
export interface ApiResponse<T> {
  /** Response data (parsed if parseJson is true) */
  data: T;

  /** Response metadata */
  meta: ResponseMeta;

  /** HTTP status code */
  status?: number;

  /** Response headers */
  headers?: Headers;
}

/**
 * API error types
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  PARSE_ERROR = 'parse_error',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  ABORT_ERROR = 'abort_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * API error class
 */
export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly status?: number;
  public readonly response?: Response;
  public readonly originalError?: Error;
  public readonly url?: string;

  constructor(
    message: string,
    type: ApiErrorType,
    status?: number,
    response?: Response,
    originalError?: Error,
    url?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.response = response;
    this.originalError = originalError;
    this.url = url;
  }

  /**
   * Create an ApiError from a Response object
   */
  static fromResponse(response: Response, originalError?: Error): ApiError {
    const status = response.status;
    const url = response.url;

    if (status >= 500) {
      return new ApiError(
        `Server error: ${status} ${response.statusText}`,
        ApiErrorType.SERVER_ERROR,
        status,
        response,
        originalError,
        url
      );
    } else if (status >= 400) {
      return new ApiError(
        `Client error: ${status} ${response.statusText}`,
        ApiErrorType.CLIENT_ERROR,
        status,
        response,
        originalError,
        url
      );
    }

    return new ApiError(
      `Unknown error: ${status} ${response.statusText}`,
      ApiErrorType.UNKNOWN_ERROR,
      status,
      response,
      originalError,
      url
    );
  }

  /**
   * Create an ApiError from any error
   */
  static from(error: unknown, url?: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    // Handle different error types safely
    const errorObj = (error as { message?: string; name?: string }) || {};
    const message = typeof errorObj.message === 'string' ? errorObj.message : 'Unknown API error';
    const errorName = typeof errorObj.name === 'string' ? errorObj.name : '';

    if (errorName === 'AbortError') {
      return new ApiError(
        'Request aborted',
        ApiErrorType.ABORT_ERROR,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(message),
        url
      );
    } else if (errorName === 'TimeoutError' || message.includes('timeout')) {
      return new ApiError(
        'Request timed out',
        ApiErrorType.TIMEOUT_ERROR,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(message),
        url
      );
    } else if (message.includes('NetworkError') || message.includes('network')) {
      return new ApiError(
        'Network error',
        ApiErrorType.NETWORK_ERROR,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(message),
        url
      );
    } else if (message.includes('JSON')) {
      return new ApiError(
        'Error parsing response',
        ApiErrorType.PARSE_ERROR,
        undefined,
        undefined,
        error instanceof Error ? error : new Error(message),
        url
      );
    }

    return new ApiError(
      message,
      ApiErrorType.UNKNOWN_ERROR,
      undefined,
      undefined,
      error instanceof Error ? error : new Error(message),
      url
    );
  }
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;

  /** When the entry was created (timestamp) */
  timestamp: number;

  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Retry configuration for API requests
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Base delay between retries in milliseconds */
  retryDelay: number;

  /** Backoff multiplier for increasing delay between retries */
  retryBackoff?: number | undefined;

  /** Function to determine if a request should be retried */
  retryCondition?: (error: ApiError) => boolean | undefined;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (
  url: string,
  options: RequestInit
) =>
  | { url: string; options: RequestInit }
  | void
  | Promise<{ url: string; options: RequestInit } | void>;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = (
  response: Response,
  error?: ApiError
) =>
  | { response: Response; error?: ApiError }
  | void
  | Promise<{ response: Response; error?: ApiError } | void>;

/**
 * Post-parse API response interceptor type
 * Allows transforming the parsed ApiResponse (e.g., mutating data for tests/UI integration)
 */
export type DataResponseInterceptor = (
  apiResponse: ApiResponse<any>
) => ApiResponse<any> | void | Promise<ApiResponse<any> | void>;

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /** Base URL for all API requests */
  baseUrl?: string | undefined;

  /** Default headers to include with all requests */
  defaultHeaders?: Record<string, string> | undefined;

  /** Default request timeout in milliseconds */
  defaultTimeout?: number | undefined;

  /** Whether to include credentials by default */
  withCredentials?: boolean | undefined;

  /** Whether to handle errors automatically by default */
  handleErrors?: boolean | undefined;

  /** Whether to parse JSON responses by default */
  parseJson?: boolean | undefined;

  /** Whether to use caching for GET requests by default */
  useCache?: boolean | undefined;

  /** Default cache time-to-live in milliseconds */
  cacheTtl?: number | undefined;

  /** Function to call before each request (single) */
  beforeRequest?: RequestInterceptor | undefined;

  /** Function(s) to call before each request (multiple, processed in order) */
  requestInterceptors?: RequestInterceptor[] | undefined;

  /** Function to call after each response (single) */
  afterResponse?: ResponseInterceptor | undefined;

  /** Function(s) to call after each response (multiple, processed in order) */
  responseInterceptors?: ResponseInterceptor[] | undefined;

  /** Function(s) to call after response is parsed to data */
  dataResponseInterceptors?: DataResponseInterceptor[] | undefined;

  /** Retry configuration for failed requests */
  retryConfig?: RetryConfig | undefined;

  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean | undefined;
}
