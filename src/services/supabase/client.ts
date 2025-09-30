/**
 * Supabase client service
 * Provides a standardized interface for accessing Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { SupabaseResult, QueryOptions } from './types';

/**
 * Enhanced Supabase client with error handling and standardized responses
 */
class SupabaseService {
  /**
   * Execute a query with standardized error handling
   * @param operation - Async function performing the Supabase operation
   * @returns Standardized result object
   */
  private async executeQuery<T>(
    operation: () => Promise<{
      data: T | null;
      error: unknown;
    }>
  ): Promise<SupabaseResult<T>> {
    try {
      const { data, error } = await operation();

      if (error) {
        return {
          data: null,
          error,
          status: 'error',
        };
      }

      return {
        data,
        error: null,
        status: 'success',
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          details: '',
          hint: '',
          code: '500',
        },
        status: 'error',
      };
    }
  }

  /**
   * Get a record by ID
   * @param table - Supabase table name
   * @param id - Record ID
   * @returns The record or null if not found
   */
  async getById<T extends Record<string, unknown>>(
    table: string,
    id: string | number,
    column = 'id'
  ): Promise<SupabaseResult<T>> {
    return this.executeQuery<T>(() => supabase.from(table).select('*').eq(column, id).single());
  }

  /**
   * Get multiple records with filtering options
   * @param table - Supabase table name
   * @param options - Query options for filtering, pagination, and sorting
   * @returns Array of records matching the criteria
   */
  async getMany<T extends Record<string, unknown>>(
    table: string,
    options?: QueryOptions<T>
  ): Promise<SupabaseResult<T[]>> {
    let query = supabase.from(table).select('*');

    // Apply filters if provided
    if (options?.filters) {
      for (const filter of options.filters) {
        const { field, operator, value } = filter;
        switch (operator) {
          case 'eq':
            query = query.eq(field as string, value);
            break;
          case 'neq':
            query = query.neq(field as string, value);
            break;
          case 'gt':
            query = query.gt(field as string, value);
            break;
          case 'lt':
            query = query.lt(field as string, value);
            break;
          case 'gte':
            query = query.gte(field as string, value);
            break;
          case 'lte':
            query = query.lte(field as string, value);
            break;
          case 'in':
            query = query.in(field as string, value as unknown[]);
            break;
          case 'is':
            query = query.is(field as string, value);
            break;
        }
      }
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    // Apply ordering
    if (options?.orderBy) {
      const { column, ascending = true } = options.orderBy;
      query = query.order(column as string, { ascending });
    }

    return this.executeQuery<T[]>(() => query);
  }

  /**
   * Insert a new record
   * @param table - Supabase table name
   * @param data - Record data to insert
   * @returns The inserted record
   */
  async insert<T extends Record<string, unknown>>(
    table: string,
    data: Partial<T>
  ): Promise<SupabaseResult<T>> {
    return this.executeQuery<T>(() => supabase.from(table).insert(data).select('*').single());
  }

  /**
   * Update an existing record
   * @param table - Supabase table name
   * @param id - Record ID
   * @param data - Record data to update
   * @returns The updated record
   */
  async update<T extends Record<string, unknown>>(
    table: string,
    id: string | number,
    data: Partial<T>,
    column = 'id'
  ): Promise<SupabaseResult<T>> {
    return this.executeQuery<T>(() =>
      supabase.from(table).update(data).eq(column, id).select('*').single()
    );
  }

  /**
   * Delete a record
   * @param table - Supabase table name
   * @param id - Record ID
   * @returns The deleted record
   */
  async delete<T extends Record<string, unknown>>(
    table: string,
    id: string | number,
    column = 'id'
  ): Promise<SupabaseResult<T>> {
    return this.executeQuery<T>(() =>
      supabase.from(table).delete().eq(column, id).select('*').single()
    );
  }

  /**
   * Execute a raw query with full control
   * @param queryFn - Function that builds and executes a Supabase query
   * @returns The query result
   */
  async executeRawQuery<T>(
    queryFn: () => Promise<{
      data: T | null;
      error: unknown;
    }>
  ): Promise<SupabaseResult<T>> {
    return this.executeQuery<T>(queryFn);
  }

  /**
   * Get the raw Supabase client for advanced operations
   * @returns The Supabase client instance
   */
  getRawClient() {
    return supabase;
  }
}

// Export as a singleton
export const supabaseService = new SupabaseService();
