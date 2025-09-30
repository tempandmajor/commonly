/**
 * Safe Supabase query helpers to handle query errors gracefully
 */

export interface SafeQueryResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function handleSupabaseResponse<T>(response: any): { data: T | null; error: string | null } {
  if (response?.error) {
    console.error('Supabase query error:', response.error);
    return { data: null, error: response.error.message || 'Database query failed' };
  }

  if (Array.isArray(response?.data)) {
    // Filter out error objects from arrays
    const validData = response.data.filter(
      (item: any) => item && typeof item === 'object' && !item.error
    );
    return { data: validData as T, error: null };
  }

  if (response?.data && typeof response.data === 'object' && response.data.error) {
    return { data: null, error: 'Invalid data relationship' };
  }

  return response
    ? { data: (response.data ?? null) as T | null, error: null }
    : { data: null, error: null };
}

export function createEmptyState<T>(defaultValue: T): T {
  return defaultValue;
}

export async function safeSupabaseQuery<T>(
  queryOrPromise: Promise<any> | { then: (fn: any) => any },
  defaultValue: T
): Promise<{ data: T; error: string | null }> {
  try {
    // Handle both Promises and PromiseLike query builders
    const response = await queryOrPromise;
    const { data, error } = handleSupabaseResponse<T>(response);

    if (error) {
      return { data: defaultValue, error };
    }

    return { data: data || defaultValue, error: null };
  } catch (e) {
    console.error('Query execution error:', e);
    return {
      data: defaultValue,
      error: e instanceof Error ? e.message : 'Unknown database error',
    };
  }
}

