# API Client Service

This module provides a consolidated API client service for the Commonly app, handling all HTTP requests, response handling, caching, and error management consistently across the application.

## Directory Structure

```
/src/services/api/
  /client/       - Core API client and pre-configured clients
  /core/         - Types and interfaces
  /hooks/        - React hooks for API requests
  /utils/        - API-specific utilities
  /compatibility/ - Legacy compatibility layers
  /tests/        - Unit tests
  README.md      - This documentation file
  index.ts       - Main export file
```

## Usage

### Modern Usage (Recommended)

```typescript
// Import pre-configured clients
import { appClient, externalClient } from '@/services/api';

// Basic GET request
const response = await appClient.get('/users/123');
const userData = response.data;

// POST request with body
const createResponse = await appClient.post('/users', {
  name: 'New User',
  email: 'user@example.com'
});

// Use with React hooks
import { useApiGet, useApiPost } from '@/services/api';

function UserComponent() {
  // Fetch data with automatic loading/error states
  const [{ data: user, loading, error }] = useApiGet('/users/123');
  
  // Post data with a submit handler
  const [{ loading: submitting }, createUser] = useApiPost('/users');
  
  const handleSubmit = async (userData) => {
    try {
      const newUser = await createUser(userData);
      console.log('Created user:', newUser);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  return (
    <div>
      {loading ? 'Loading...' : user ? user.name : 'No user'}
      <button onClick={handleSubmit} disabled={submitting}>Create User</button>
    </div>
  );
}
```

### Legacy Usage (Backward Compatibility)

```typescript
// Import legacy service
import { ApiService } from '@/services/api';

// Using legacy API service
const userData = await ApiService.get('/users/123');
const newUser = await ApiService.post('/users', { name: 'New User' });
```

## Core Features

### HTTP Requests

- Consistent interface for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Support for request bodies, query parameters, and headers
- Automatic JSON parsing and stringifying
- Custom timeout handling

### Performance & Reliability

- Automatic retry logic for failed requests with configurable conditions
- Exponential backoff strategy for retries
- Performance monitoring with request duration tracking
- Request/response interceptors for cross-cutting concerns

### Error Handling

- Standardized error types and messages
- Automatic error classification (network, server, client, etc.)
- Toast notifications for common errors
- Detailed error information for debugging

### Caching

- In-memory request caching for GET requests
- Configurable cache TTL (time-to-live)
- Cache control on a per-request basis
- Methods to clear cache entries or the entire cache

### React Integration

- Hooks for all HTTP methods
- Automatic loading, error, and data states
- Pagination utilities
- Debounced API requests

## API Reference

### API Client

```typescript
// Core client class
const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: { 'X-API-Key': 'your-api-key' },
  defaultTimeout: 30000,
  withCredentials: true,
  handleErrors: true,
  parseJson: true,
  useCache: true,
  cacheTtl: 300000,
  // Retry configuration
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryBackoff: 2,
    retryCondition: (error) => error.status >= 500 || error.type === ApiErrorType.NETWORK_ERROR
  },
  // Interceptors
  requestInterceptors: [(request) => {
    // Modify request before sending
    request.headers.set('X-Request-Time', new Date().toISOString());
    return request;
  }],
  responseInterceptors: [(response) => {
    // Process response after receiving
    console.log(`Request to ${response.meta.url} took ${response.meta.duration}ms`);
    return response;
  }]
});

// HTTP methods
client.get<T>(url, options?): Promise<ApiResponse<T>>
client.post<T>(url, body?, options?): Promise<ApiResponse<T>>
client.put<T>(url, body?, options?): Promise<ApiResponse<T>>
client.patch<T>(url, body?, options?): Promise<ApiResponse<T>>
client.delete<T>(url, body?, options?): Promise<ApiResponse<T>>

// Low-level request method
client.request<T>(url, method, body?, options?): Promise<ApiResponse<T>>

// Cache management
client.clearCache(): void
client.clearCacheEntry(url, method?): void
```

### Pre-configured Clients

```typescript
// Core app API (uses NEXT_PUBLIC_API_URL)
appClient: ApiClient

// Supabase REST API (uses NEXT_PUBLIC_SUPABASE_URL)
supabaseRestClient: ApiClient

// External API client (no credentials)
externalClient: ApiClient

// Analytics client (optimized for non-blocking analytics)
analyticsClient: ApiClient

// Create custom client
createApiClient(config): ApiClient
```

### React Hooks

```typescript
// GET hook
const [{ data, loading, error, meta }, fetchData, refetch] = useApiGet<T>(url, {
  immediate?: boolean,
  dependencies?: any[],
  client?: ApiClient,
  skip?: boolean,
});

// POST hook
const [{ data, loading, error, meta }, postData] = useApiPost<T, B>(url, {
  client?: ApiClient,
});

// Other HTTP method hooks
useApiPut<T, B>(url, options?)
useApiPatch<T, B>(url, options?)
useApiDelete<T, B>(url, options?)
useApiRequest<T, B>(method, url, options?)
```

### Utilities

```typescript
// Add query parameters to URL
addQueryParams(url, params?): string

// Fetch paginated data
fetchPaginatedData<T>(url, page?, pageSize?, additionalParams?): Promise<{ 
  data: T[], 
  meta: { currentPage, totalPages, totalItems, pageSize } 
}>

// Run multiple requests with concurrency control
batchRequests<T>(requests, options?): Promise<(T | Error)[]>

// Create debounced API request function
debounceRequest<T, A extends any[]>(requestFn, delayMs?): (...args: A) => Promise<T>

// Handle API errors
handleApiError(error, options?): string

// Create FormData from object
createFormData(data): FormData
```

## Types

```typescript
// HTTP methods
enum HttpMethod {
  GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
}

// Request options
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  handleErrors?: boolean;
  parseJson?: boolean;
  useCache?: boolean;
  cacheTtl?: number;
  signal?: AbortSignal;
}

// API response
interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
}

// Response metadata
interface ResponseMeta {
  status: number;
  statusText?: string;
  headers?: Headers;
  ok: boolean;
  fromCache?: boolean;
  duration?: number;
  url?: string;
  method?: string;
}

// Error types
enum ApiErrorType {
  NETWORK_ERROR, TIMEOUT_ERROR, PARSE_ERROR, SERVER_ERROR, CLIENT_ERROR, ABORT_ERROR, UNKNOWN_ERROR
}

// API error
class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  response?: Response;
  originalError?: Error;
  url?: string;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryBackoff?: number;
  retryCondition: (error: ApiError) => boolean;
}

// Interceptors
type RequestInterceptorFn = (request: Request) => Request | Promise<Request>;
type ResponseInterceptorFn = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

// API client configuration
interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
  withCredentials?: boolean;
  handleErrors?: boolean;
  parseJson?: boolean;
  useCache?: boolean;
  cacheTtl?: number;
  retryConfig?: RetryConfig;
  requestInterceptors?: RequestInterceptorFn[];
  responseInterceptors?: ResponseInterceptorFn[];
}
```

## Error Handling

The API client automatically handles common errors:

- **Network Errors**: Connection issues, offline state
- **Timeout Errors**: Requests that take too long
- **Server Errors (5xx)**: Internal server errors
- **Client Errors (4xx)**: Authentication, validation, etc.
- **Parse Errors**: Invalid JSON responses
- **Abort Errors**: Manually aborted requests

Each error type has appropriate default messaging and handling.

## Caching Strategy

The API client provides a flexible caching system:

1. In-memory caching for GET requests (configurable)
2. Automatic cache invalidation based on TTL
3. Cache can be cleared programmatically
4. Cache behavior can be controlled per-request

## Migration Strategy

1. For new code, use the consolidated API:
   ```typescript
   import { appClient, useApiGet } from '@/services/api';
   ```

2. For existing code, continue using the compatibility layer:
   ```typescript
   import { ApiService } from '@/services/api';
   ```

3. Gradually migrate to the new API as code is updated.

## Testing

Run unit tests for the API client service:

```bash
npm run test src/services/api
```
