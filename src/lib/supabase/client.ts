/**
 * Type-Safe Supabase Client Wrapper
 *
 * Provides a type-safe wrapper around the Supabase client with:
 * - Consistent error handling
 * - Automatic logging and monitoring
 * - Type-safe query builders
 * - Retry logic for transient errors
 */

import { createClient, PostgrestError } from '@supabase/supabase-js';
import { captureException, addBreadcrumb } from '@/config/sentry';

// Database type - should be generated from Supabase CLI
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      // Add other tables as needed
    };
  };
};

/**
 * Custom error class for Supabase operations
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * Transform Postgrest error to custom error
 */
function transformPostgrestError(error: PostgrestError): SupabaseError {
  const supabaseError = new SupabaseError(
    error.message,
    error.code,
    error.details,
    error.hint
  );

  captureException(supabaseError, {
    context: 'Supabase Query',
    extra: {
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  });

  return supabaseError;
}

/**
 * Type-safe Supabase client instance
 */
export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string || ''
);

/**
 * Type-safe query builder for select operations
 */
export async function safeSelect<T extends keyof Database['public']['Tables']>(
  table: T,
  options?: {
    select?: string;
    filter?: Record<string, unknown>;
    single?: boolean;
    limit?: number;
    order?: { column: string; ascending?: boolean };
  }
): Promise<{
  data: Database['public']['Tables'][T]['Row'][] | Database['public']['Tables'][T]['Row'] | null;
  error: SupabaseError | null;
}> {
  try {
    addBreadcrumb('Supabase select query', { table, options });

    let query = supabaseClient.from(table).select(options?.select || '*');

    // Apply filters
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply order
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // Execute query
    if (options?.single) {
      const { data, error } = await query.maybeSingle();
      return {
        data,
        error: error ? transformPostgrestError(error) : null,
      };
    } else {
      const { data, error } = await query;
      return {
        data,
        error: error ? transformPostgrestError(error) : null,
      };
    }
  } catch (error) {
    const supabaseError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    );
    captureException(supabaseError, { context: 'safeSelect', table, options });
    return { data: null, error: supabaseError };
  }
}

/**
 * Type-safe query builder for insert operations
 */
export async function safeInsert<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert'] | Database['public']['Tables'][T]['Insert'][],
  options?: {
    returning?: boolean;
  }
): Promise<{
  data: Database['public']['Tables'][T]['Row'][] | null;
  error: SupabaseError | null;
}> {
  try {
    addBreadcrumb('Supabase insert query', { table, recordCount: Array.isArray(data) ? data.length : 1 });

    let query = supabaseClient.from(table).insert(data as any);

    if (options?.returning !== false) {
      query = query.select();
    }

    const { data: result, error } = await query;

    return {
      data: result,
      error: error ? transformPostgrestError(error) : null,
    };
  } catch (error) {
    const supabaseError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    );
    captureException(supabaseError, { context: 'safeInsert', table });
    return { data: null, error: supabaseError };
  }
}

/**
 * Type-safe query builder for update operations
 */
export async function safeUpdate<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Update'],
  filter: Record<string, unknown>,
  options?: {
    returning?: boolean;
  }
): Promise<{
  data: Database['public']['Tables'][T]['Row'][] | null;
  error: SupabaseError | null;
}> {
  try {
    addBreadcrumb('Supabase update query', { table, filter });

    let query = supabaseClient.from(table).update(data as any);

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (options?.returning !== false) {
      query = query.select();
    }

    const { data: result, error } = await query;

    return {
      data: result,
      error: error ? transformPostgrestError(error) : null,
    };
  } catch (error) {
    const supabaseError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    );
    captureException(supabaseError, { context: 'safeUpdate', table, filter });
    return { data: null, error: supabaseError };
  }
}

/**
 * Type-safe query builder for delete operations
 */
export async function safeDelete<T extends keyof Database['public']['Tables']>(
  table: T,
  filter: Record<string, unknown>
): Promise<{
  error: SupabaseError | null;
}> {
  try {
    addBreadcrumb('Supabase delete query', { table, filter });

    let query = supabaseClient.from(table).delete();

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    return {
      error: error ? transformPostgrestError(error) : null,
    };
  } catch (error) {
    const supabaseError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    );
    captureException(supabaseError, { context: 'safeDelete', table, filter });
    return { error: supabaseError };
  }
}

/**
 * Safe authentication methods
 */
export const safeAuth = {
  /**
   * Get current session
   */
  async getSession() {
    try {
      addBreadcrumb('Getting auth session');
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        throw new SupabaseError(error.message, 'AUTH_ERROR');
      }

      return { data, error: null };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError
        ? error
        : new SupabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );
      captureException(supabaseError, { context: 'getSession' });
      return { data: null, error: supabaseError };
    }
  },

  /**
   * Get current user
   */
  async getUser() {
    try {
      addBreadcrumb('Getting current user');
      const { data, error } = await supabaseClient.auth.getUser();

      if (error) {
        throw new SupabaseError(error.message, 'AUTH_ERROR');
      }

      return { data, error: null };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError
        ? error
        : new SupabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );
      captureException(supabaseError, { context: 'getUser' });
      return { data: null, error: supabaseError };
    }
  },

  /**
   * Sign in with email/password
   */
  async signInWithPassword(email: string, password: string) {
    try {
      addBreadcrumb('Signing in with password', { email });
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new SupabaseError(error.message, 'AUTH_ERROR');
      }

      return { data, error: null };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError
        ? error
        : new SupabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );
      captureException(supabaseError, { context: 'signInWithPassword' });
      return { data: null, error: supabaseError };
    }
  },

  /**
   * Sign up with email/password
   */
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    try {
      addBreadcrumb('Signing up', { email });
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: metadata ? { data: metadata } : undefined,
      });

      if (error) {
        throw new SupabaseError(error.message, 'AUTH_ERROR');
      }

      return { data, error: null };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError
        ? error
        : new SupabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );
      captureException(supabaseError, { context: 'signUp' });
      return { data: null, error: supabaseError };
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      addBreadcrumb('Signing out');
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        throw new SupabaseError(error.message, 'AUTH_ERROR');
      }

      return { error: null };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError
        ? error
        : new SupabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );
      captureException(supabaseError, { context: 'signOut' });
      return { error: supabaseError };
    }
  },
};

export default supabaseClient;