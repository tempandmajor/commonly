/**
 * Supabase service types
 * This file contains types for the Supabase service layer
 */

import { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export type SupabaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
  status: 'success' | 'error';
};

export type SupabaseTable = keyof Database['public']['Tables'];

// Error types for better error handling
export enum SupabaseErrorCode {
  NOT_FOUND = 'not_found',
  ALREADY_EXISTS = 'already_exists',
  PERMISSION_DENIED = 'permission_denied',
  INVALID_REQUEST = 'invalid_request',
  UNKNOWN_ERROR = 'unknown_error',
}

export type SupabaseServiceError = {
  code: SupabaseErrorCode;
  message: string;
  originalError?: PostgrestError;
};

// Common filtering options for queries
export type QueryOptions<T extends Record<string, unknown>> = {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: keyof T;
    ascending?: boolean;
  };
  filters?: {
    field: keyof T;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'is';
    value: unknown;
  }[];
};
