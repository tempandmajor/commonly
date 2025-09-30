/**
 * Database Service - Core Client
 * Rebuilt with proper TypeScript types and architecture
 */

import { toast } from 'sonner';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import {
  DatabaseError,
  DatabaseErrorType,
  DatabaseOptions,
  QueryOperation,
  QueryResult,
  SingleResult,
  MutationResult,
} from '../core/types';

// Default options for database operations
const DEFAULT_DATABASE_OPTIONS: DatabaseOptions = {
  schema: 'public',
  timeout: 10000, // 10 seconds
  debug: false,
  returning: 'representation',
};

/**
 * Core Database Client
 * Handles database connections and operations with proper type safety
 */
export class DatabaseClient {
  private readonly supabase: SupabaseClient<Database>;
  private readonly options: DatabaseOptions;

  /**
   * Create a new database client with environment validation
   */
  constructor(options: Partial<DatabaseOptions> = {}) {
    this.options = { ...DEFAULT_DATABASE_OPTIONS, ...options };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Execute a raw SQL query with proper error handling
   */
  async query<T = any>(
    query: string,
    params: unknown[] = [],
    options: Partial<DatabaseOptions> = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };

    try {
      if (mergedOptions.debug) {
        console.log(`[DatabaseClient] Executing query: ${query}`, { params });
      }

      const { data, error, count } = await this.supabase.rpc('execute_sql', {
        query_text: query,
        query_params: params,
      });

      if (error) {
        throw this.handleDatabaseError(error, query, params, undefined, QueryOperation.RPC);
      }

      const executionTime = Date.now() - startTime;

      return {
        data: data as T[],
        metadata: {
          executionTime,
          rowCount: data ? data.length : 0,
          totalCount: count || 0,
          query,
          operation: QueryOperation.RPC,
        },
        error: null,
      };
    } catch (error) {
      const dbError = this.handleDatabaseError(error, query, params, undefined, QueryOperation.RPC);

      if (mergedOptions.debug) {
        console.error(`[DatabaseClient] Query failed: ${query}`, { error, params });
      }

      return {
        data: [],
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          totalCount: 0,
          query,
          operation: QueryOperation.RPC,
        },
        error: dbError,
      };
    }
  }

  /**
   * Get an instance of the Supabase client
   */
  getSupabaseClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Get a query builder for a table with schema support
   */
  from(table: string, options: Partial<DatabaseOptions> = {}) {
    const schema = options.schema || this.options.schema;
    return this.supabase.from(`${schema}.${table}`);
  }

  /**
   * Select data from a table with comprehensive error handling
   */
  async select<T = any>(
    table: string,
    columns: string = '*',
    options: Partial<DatabaseOptions> = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    const schema = mergedOptions.schema || 'public';

    try {
      if (mergedOptions.debug) {
        console.log(`[DatabaseClient] Selecting from ${schema}.${table}`, { columns });
      }

      const { data, error, count } = await this.supabase
        .from(table)
        .select(columns, { count: 'exact' });

      if (error) {
        throw this.handleDatabaseError(
          error,
          `SELECT ${columns} FROM ${schema}.${table}`,
          {},
          table,
          QueryOperation.SELECT
        );
      }

      const executionTime = Date.now() - startTime;

      return {
        data: data as T[],
        metadata: {
          executionTime,
          rowCount: data ? data.length : 0,
          totalCount: count || 0,
          operation: QueryOperation.SELECT,
          table,
        },
        error: null,
      };
    } catch (error) {
      const dbError = this.handleDatabaseError(
        error,
        `SELECT ${columns} FROM ${schema}.${table}`,
        {},
        table,
        QueryOperation.SELECT
      );

      if (mergedOptions.debug) {
        console.error(`[DatabaseClient] Select failed on ${schema}.${table}`, { error, columns });
      }

      return {
        data: [],
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          totalCount: 0,
          operation: QueryOperation.SELECT,
          table,
        },
        error: dbError,
      };
    }
  }

  /**
   * Insert data into a table with proper error handling and type safety
   */
  async insert<T = any>(
    table: string,
    data: Record<string, unknown> | Record<string, unknown>[],
    options: Partial<DatabaseOptions> = {}
  ): Promise<MutationResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    const schema = mergedOptions.schema || 'public';

    try {
      if (mergedOptions.debug) {
        console.log(`[DatabaseClient] Inserting into ${schema}.${table}`, { data });
      }

      let query = this.supabase.from(table).insert(data);

      if (mergedOptions.returning === 'representation') {
        query = query.select('*');
      }

      const { data: result, error, count } = await query;

      if (error) {
        throw this.handleDatabaseError(
          error,
          `INSERT INTO ${schema}.${table}`,
          data,
          table,
          QueryOperation.INSERT
        );
      }

      const executionTime = Date.now() - startTime;

      return {
        data: result as T[],
        metadata: {
          executionTime,
          rowCount: result ? result.length : 0,
          totalCount: count || 0,
          operation: QueryOperation.INSERT,
          table,
        },
        error: null,
        count: count || 0,
      };
    } catch (error) {
      const dbError = this.handleDatabaseError(
        error,
        `INSERT INTO ${schema}.${table}`,
        data,
        table,
        QueryOperation.INSERT
      );

      if (mergedOptions.debug) {
        console.error(`[DatabaseClient] Insert failed on ${schema}.${table}`, { error, data });
      }

      return {
        data: [],
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          totalCount: 0,
          operation: QueryOperation.INSERT,
          table,
        },
        error: dbError,
        count: 0,
      };
    }
  }

  /**
   * Update data in a table with error handling and flexible matching
   */
  async update<T = any>(
    table: string,
    data: Record<string, unknown>,
    match: Record<string, unknown>,
    options: Partial<DatabaseOptions> = {}
  ): Promise<MutationResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    const schema = mergedOptions.schema || 'public';

    try {
      if (mergedOptions.debug) {
        console.log(`[DatabaseClient] Updating ${schema}.${table}`, { data, match });
      }

      let query = this.supabase.from(table).update(data);

      // Apply match conditions
      Object.entries(match).forEach(([column, value]) => {
        query = query.eq(column, value);
      });

      if (mergedOptions.returning === 'representation') {
        query = query.select('*');
      }

      const { data: result, error, count } = await query;

      if (error) {
        throw this.handleDatabaseError(
          error,
          `UPDATE ${schema}.${table}`,
          { data, match },
          table,
          QueryOperation.UPDATE
        );
      }

      const executionTime = Date.now() - startTime;

      return {
        data: result as T[],
        metadata: {
          executionTime,
          rowCount: result ? result.length : 0,
          totalCount: count || 0,
          operation: QueryOperation.UPDATE,
          table,
        },
        error: null,
        count: count || 0,
      };
    } catch (error) {
      const dbError = this.handleDatabaseError(
        error,
        `UPDATE ${schema}.${table}`,
        { data, match },
        table,
        QueryOperation.UPDATE
      );

      if (mergedOptions.debug) {
        console.error(`[DatabaseClient] Update failed on ${schema}.${table}`, { error, data, match });
      }

      return {
        data: [],
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          totalCount: 0,
          operation: QueryOperation.UPDATE,
          table,
        },
        error: dbError,
        count: 0,
      };
    }
  }

  /**
   * Delete data from a table with comprehensive error handling
   */
  async delete<T = any>(
    table: string,
    match: Record<string, unknown>,
    options: Partial<DatabaseOptions> = {}
  ): Promise<MutationResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    const schema = mergedOptions.schema || 'public';

    try {
      if (mergedOptions.debug) {
        console.log(`[DatabaseClient] Deleting from ${schema}.${table}`, { match });
      }

      let query = this.supabase.from(table).delete();

      // Apply match conditions
      Object.entries(match).forEach(([column, value]) => {
        query = query.eq(column, value);
      });

      if (mergedOptions.returning === 'representation') {
        query = query.select('*');
      }

      const { data: result, error, count } = await query;

      if (error) {
        throw this.handleDatabaseError(
          error,
          `DELETE FROM ${schema}.${table}`,
          match,
          table,
          QueryOperation.DELETE
        );
      }

      const executionTime = Date.now() - startTime;

      return {
        data: result as T[],
        metadata: {
          executionTime,
          rowCount: result ? result.length : 0,
          totalCount: count || 0,
          operation: QueryOperation.DELETE,
          table,
        },
        error: null,
        count: count || 0,
      };
    } catch (error) {
      const dbError = this.handleDatabaseError(
        error,
        `DELETE FROM ${schema}.${table}`,
        match,
        table,
        QueryOperation.DELETE
      );

      if (mergedOptions.debug) {
        console.error(`[DatabaseClient] Delete failed on ${schema}.${table}`, { error, match });
      }

      return {
        data: [],
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          totalCount: 0,
          operation: QueryOperation.DELETE,
          table,
        },
        error: dbError,
        count: 0,
      };
    }
  }

  /**
   * Get a single record by id with comprehensive error handling
   */
  async getById<T = any>(
    table: string,
    id: string | number,
    idColumn: string = 'id',
    columns: string = '*',
    options: Partial<DatabaseOptions> = {}
  ): Promise<SingleResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    const schema = mergedOptions.schema || 'public';

    try {
      if (mergedOptions.debug) {
        console.log(`[DatabaseClient] Getting record by ${idColumn} from ${schema}.${table}`, { id, columns });
      }

      const { data, error } = await this.supabase
        .from(table)
        .select(columns)
        .eq(idColumn, id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found - return null data without error
          return {
            data: null,
            metadata: {
              executionTime: Date.now() - startTime,
              rowCount: 0,
              operation: QueryOperation.SELECT,
              table,
            },
            error: null,
          };
        }

        throw this.handleDatabaseError(
          error,
          `SELECT ${columns} FROM ${schema}.${table} WHERE ${idColumn} = ${id}`,
          { id },
          table,
          QueryOperation.SELECT
        );
      }

      return {
        data: data as T,
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: data ? 1 : 0,
          operation: QueryOperation.SELECT,
          table,
        },
        error: null,
      };
    } catch (error) {
      const dbError = this.handleDatabaseError(
        error,
        `SELECT ${columns} FROM ${schema}.${table} WHERE ${idColumn} = ${id}`,
        { id },
        table,
        QueryOperation.SELECT
      );

      if (mergedOptions.debug) {
        console.error(`[DatabaseClient] GetById failed on ${schema}.${table}`, { error, id, idColumn });
      }

      return {
        data: null,
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          operation: QueryOperation.SELECT,
          table,
        },
        error: dbError,
      };
    }
  }

  /**
   * Handle database errors and convert them to DatabaseError type with comprehensive error mapping
   */
  private handleDatabaseError(
    error: any,
    query?: string,
    params?: unknown,
    table?: string,
    operation?: QueryOperation
  ): DatabaseError {
    let errorType = DatabaseErrorType.UNKNOWN_ERROR;
    let errorMessage = error?.message || 'An unknown database error occurred';

    // Determine the type of error based on error codes
    if (error?.code) {
      switch (error.code) {
        case '23505':
          errorType = DatabaseErrorType.CONSTRAINT_ERROR;
          errorMessage = 'A record with this information already exists';
          break;
        case '23503':
          errorType = DatabaseErrorType.CONSTRAINT_ERROR;
          errorMessage = 'This operation would violate referential integrity';
          break;
        case '23502':
          errorType = DatabaseErrorType.CONSTRAINT_ERROR;
          errorMessage = 'A required field is missing';
          break;
        case '42501':
        case '42P01':
          errorType = DatabaseErrorType.PERMISSION_ERROR;
          errorMessage = 'You do not have permission to perform this operation';
          break;
        case 'PGRST116':
          errorType = DatabaseErrorType.NOT_FOUND_ERROR;
          errorMessage = 'No records found';
          break;
        case '28000':
        case 'PGRST301':
          errorType = DatabaseErrorType.AUTHENTICATION_ERROR;
          errorMessage = 'Authentication error';
          break;
        case '57014':
          errorType = DatabaseErrorType.TIMEOUT_ERROR;
          errorMessage = 'The operation timed out';
          break;
        case 'PGRST129':
          errorType = DatabaseErrorType.RATE_LIMIT_ERROR;
          errorMessage = 'Rate limit exceeded';
          break;
        default:
          if (error.code.startsWith('42')) {
            errorType = DatabaseErrorType.QUERY_ERROR;
            errorMessage = 'Invalid query syntax or database structure error';
          }
      }
    } else if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorType = DatabaseErrorType.CONNECTION_ERROR;
        errorMessage = 'Failed to connect to the database';
      } else if (error.message.includes('timeout')) {
        errorType = DatabaseErrorType.TIMEOUT_ERROR;
        errorMessage = 'The operation timed out';
      }
    }

    // Show toast for user-facing errors unless they're just "not found" errors
    if (errorType !== DatabaseErrorType.NOT_FOUND_ERROR && this.options.debug) {
      toast.error(errorMessage);
    }

    return new DatabaseError(
      errorMessage,
      errorType,
      error,
      query,
      params,
      table,
      operation
    );
  }

  /**
   * Perform a health check on the database connection
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();

    try {
      const { error } = await this.supabase.from('users').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        return {
          healthy: false,
          error: error!.message,
          latency: Date.now() - startTime
        };
      }

      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Get connection information
   */
  getConnectionInfo(): {
    schema: string;
    timeout: number;
    debug: boolean;
    returning: string;
  } {
    return {
      schema: this.options.schema,
      timeout: this.options.timeout,
      debug: this.options.debug,
      returning: this.options.returning,
    };
  }
}

// Export a default instance with standard configuration
export const databaseClient = new DatabaseClient();
export default databaseClient;