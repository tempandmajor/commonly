import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define valid table names based on the actual Supabase schema
type ValidTableName =
  | 'users'
  | 'events'
  | 'products'
  | 'wallets'
  | 'payments'
  | 'conversations'
  | 'notifications'
  | 'stores'
  | 'locations'
  | 'user_locations'
  | 'venues'
  | 'credit_transactions'
  | 'ContentTest'
  | 'referral_codes'
  | 'transactions';

interface QueryOptions {
  orderBy?: { column: string | undefined; ascending?: boolean } | undefined | undefined | undefined;
  limit?: number;
  filters?: Record<string, unknown>;
}

interface QueryResult<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T = any>(
  table: ValidTableName,
  options: QueryOptions = {}
): QueryResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use type assertion to avoid recursion
      let query = (supabase as unknown).from(table).select('*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setData(result as T[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [table, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

interface MutationResult {
  loading: boolean;
  error: Error | null;
}

interface MutationOptions {
  onSuccess?: () => void | undefined;
  onError?: (error: Error) => void | undefined;
}

export function useSupabaseMutation(
  table: ValidTableName,
  options: MutationOptions = {}
): {
  add: (data: unknown) => Promise<string | null>;
  update: (id: string, data: unknown) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} & MutationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const add = async (data: unknown): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: mutationError } = await (supabase as unknown)
        .from(table)
        .insert(data)
        .select('id')
        .single();

      if (mutationError) {
        throw new Error(mutationError.message);
      }

      options.onSuccess?.();
      return result?.id || null;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: unknown): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: mutationError } = await (supabase as unknown)
        .from(table)
        .update(data)
        .eq('id', id);

      if (mutationError) {
        throw new Error(mutationError.message);
      }

      options.onSuccess?.();
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: mutationError } = await (supabase as unknown)
        .from(table)
        .delete()
        .eq('id', id);

      if (mutationError) {
        throw new Error(mutationError.message);
      }

      options.onSuccess?.();
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    add,
    update,
    remove,
    loading,
    error,
  };
}
