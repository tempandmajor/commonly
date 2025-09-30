/**
 * API Client Service - Supabase Client Configuration
 *
 * This file provides a centralized configuration for Supabase API client.
 */

import { ApiClient } from './apiClient';
import { ApiError, HttpMethod } from '../core/types';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_U as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_K as string;

// Validate environment variables
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase REST API client
 */
export const supabaseRestClient = new ApiClient({
  baseUrl: SUPABASE_URL || '',
  defaultTimeout: 30000,
  withCredentials: true,
  handleErrors: true,
  parseJson: true,
  defaultHeaders: {
    apikey: SUPABASE_ANON_KEY || '',
    'Content-Type': 'application/json',
  },
  // Request interceptor for Supabase-specific handling
  beforeRequest: (url, options) => {
    // Add authorization header if user session exists
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
      try {
        const { access_token } = JSON.parse(session) as any;
        if (access_token) {
          // Ensure headers object exists
          if (!options.headers) {
            options.headers = {};
          }

          // Convert headers to Headers object if it's not already
          if (!(options.headers instanceof Headers)) {
            const headers = new Headers();
            Object.entries(options.headers).forEach(([key, value]) => {
              if (value) headers.append(key, value);
            });
            options.headers = headers;
          }

          // Now we can safely set the Authorization header
          (options.headers as Headers).set('Authorization', `Bearer ${access_token}`);
        }
      } catch (error) {
        console.warn('Failed to parse Supabase session', error);
      }
    }
    return { url, options };
  },
  // Response interceptor for Supabase-specific error handling
  afterResponse: response => {
    // Check for authentication errors
    if (response.status === 401) {
      console.warn('Supabase authentication error, user may need to re-authenticate');
      // You could trigger a re-authentication flow here
    }
    return { response };
  },
});

/**
 * Execute a Supabase query with proper error handling
 */
export async function executeSupabaseQuery<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Convert string method to HttpMethod enum
    const method = options.method ? (options.method as HttpMethod) : HttpMethod.GET;

    const response = await supabaseRestClient.request<T>(endpoint, method, options.body);
    return response.data;
  } catch (error) {
    // Convert to ApiError if needed
    const apiError = error instanceof ApiError ? error : ApiError.from(error);

    // Special handling for Supabase-specific errors
    if (apiError.status === 401) {
      // Handle unauthorized errors
    } else if (apiError.status === 403) {
      // Handle forbidden errors
    } else if (apiError.status === 404) {
      // Handle not found errors
    }

    throw apiError;
  }
}

/**
 * Get the current Supabase authentication status
 */
export function getSupabaseAuthStatus() {
  const session = localStorage.getItem('supabase.auth.token');
  if (!session) {
    return { authenticated: false };
  }

  try {
    const parsedSession = JSON.parse(session) as any;
    return {
      authenticated: !!parsedSession.access_token,
      user: parsedSession.user,
      expires: new Date(parsedSession.expires_at * 1000),
    };
  } catch (error) {
    return { authenticated: false, error };
  }
}
