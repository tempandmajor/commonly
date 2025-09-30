/**
 * Database Service - Table Operations
 * Rebuilt with proper TypeScript types and patterns
 */

import { toast } from 'sonner';
import { databaseClient } from './databaseClient';
import { queryBuilders } from './queryBuilders';
import {
  DatabaseError,
  DatabaseErrorType,
  QueryOptions,
  QueryResult,
  SingleResult,
  MutationResult,
  QueryOperation,
} from '../core/types';

/**
 * Configuration options for table operations
 */
export interface TableOperationOptions {
  primaryKey?: string | undefined;
  schema?: string | undefined;
  debug?: boolean | undefined;
}

/**
 * Pagination metadata for query results
 */
export interface PaginationMetadata {
  page?: number | undefined;
  pageSize?: number | undefined;
  totalPages: number;
  hasMorePages: boolean;
}

/**
 * Table Operations class
 * Provides a higher-level API for working with specific tables
 */
export class TableOperations<T = any> {
  private readonly tableName: string;
  private readonly primaryKey: string;
  private readonly schema: string;
  private readonly debug: boolean;

  constructor(tableName: string, options: TableOperationOptions = {}) {
    this.tableName = tableName;
    this.primaryKey = options.primaryKey || 'id';
    this.schema = options.schema || 'public';
    this.debug = options.debug || false;
  }

  /**
   * Find all records in the table with filtering, ordering and pagination
   */
  async findAll(options: QueryOptions = {}): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      if (this.debug) {
        console.log(`[TableOperations] Finding all records in ${this.schema}.${this.tableName}`, options);
      }

      const mergedOptions = {
        schema: this.schema,
        debug: this.debug,
          ...options,
      };

      const query = databaseClient.from(this.tableName, mergedOptions);
      const builtQuery = queryBuilders.buildQuery(query, mergedOptions);
      const { data, error, count } = await builtQuery;

      if (error) {
        throw new DatabaseError(
          `Failed to find records in ${this.schema}.${this.tableName}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          `SELECT from ${this.schema}.${this.tableName}`,
          options,
          this.tableName,
          QueryOperation.SELECT
        );
      }

      const paginationMetadata = this.calculatePaginationMetadata(data, count, options);
      const executionTime = Date.now() - startTime;

      return {
        data: data as T[],
        metadata: {
          executionTime,
          rowCount: data?.length || 0,
          totalCount: count || 0,
          operation: QueryOperation.SELECT,
          table: this.tableName,
          ...paginationMetadata,
        },
        error: null,
      };

    } catch (error) {
      return this.handleQueryError(error, QueryOperation.SELECT, options, Date.now() - startTime);
    }
  }

  /**
   * Find a record by its primary key
   */
  async findById(id: string | number, options: QueryOptions = {}): Promise<SingleResult<T>> {
    const startTime = Date.now();

    try {
      if (this.debug) {
        console.log(`[TableOperations] Finding record by ${this.primaryKey} in ${this.schema}.${this.tableName}`, { id });
      }

      const { data, error } = await databaseClient
        .getSupabaseClient()
        .from(this.tableName)
        .select(options.select || options.columns || '*')
        .eq(this.primaryKey, id)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(
          `Failed to find record by ID in ${this.schema}.${this.tableName}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          `SELECT from ${this.schema}.${this.tableName} WHERE ${this.primaryKey} = ${id}`,
          { id },
          this.tableName,
          QueryOperation.SELECT
        );
      }

      return {
        data: data as T,
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: data ? 1 : 0,
          operation: QueryOperation.SELECT,
          table: this.tableName,
        },
        error: null,
      };
    } catch (error) {
      return this.handleSingleQueryError(error, QueryOperation.SELECT, { id }, Date.now() - startTime);
    }
  }

  /**
   * Find records by a specific field value
   */
  async findByField(
    field: string,
    value: unknown,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      if (this.debug) {
        console.log(`[TableOperations] Finding records by ${field} in ${this.schema}.${this.tableName}`, { field, value });
      }

      const mergedOptions: QueryOptions = {
        schema: this.schema,
        debug: this.debug,
        filters: {
          ...options.filters,
          eq: {
          ...options.filters?.eq,
            [field]: value,
          },
        },
          ...options,
      };

      return this.findAll(mergedOptions);

    } catch (error) {
      const dbError = new DatabaseError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        DatabaseErrorType.UNKNOWN_ERROR,
        error instanceof Error ? error : undefined,
        `SELECT from ${this.schema}.${this.tableName} WHERE ${field} = ${value}`,
        { field, value },
        this.tableName,
        QueryOperation.SELECT
      );

      if (this.debug) {
        console.error(`[TableOperations] FindByField failed:`, { error, field, value });
      }

      return {
        data: [],
        metadata: {
          executionTime: 0,
          rowCount: 0,
          totalCount: 0,
          operation: QueryOperation.SELECT,
          table: this.tableName,
        },
        error: dbError,
      };
    }

  }

  /**
   * Insert one or more records
   */
  async insert(
    data: Partial<T> | Partial<T>[],
    options: QueryOptions = {}
  ): Promise<MutationResult<T>> {
    const startTime = Date.now();

    try {
      if (this.debug) {
        console.log(`[TableOperations] Inserting into ${this.schema}.${this.tableName}`, { data });
      }

      const {
        data: result,
        error,
        count,
      } = await databaseClient
        .getSupabaseClient()
        .from(this.tableName)
        .insert(data)
        .select(options.returning || '*');

      if (error) {
        throw new DatabaseError(
          `Failed to insert record(s) into ${this.schema}.${this.tableName}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          `INSERT INTO ${this.schema}.${this.tableName}`,
          { data },
          this.tableName,
          QueryOperation.INSERT
        );
      }

      return {
        data: result as T[],
        metadata: {
          executionTime: Date.now() - startTime,
          ...(result && { rowCount: result.length || 0 }),
          totalCount: count || 0,
          operation: QueryOperation.INSERT,
          table: this.tableName,
        },

        error: null,
        count: count || 0,

      };

    } catch (error) {
      return this.handleMutationError(error, QueryOperation.INSERT, { data }, options, Date.now() - startTime);
    }

  }

  /**
   * Update a record by its primary key
   */

  async update(

    id: string | number,

    data: Partial<T>,

    options: QueryOptions = {}

  ): Promise<SingleResult<T>> {

    const startTime = Date.now();

    try {

      if (this.debug) {
        console.log(`[TableOperations] Updating record in ${this.schema}.${this.tableName}`, { id, data });
      }

      const { data: result, error } = await databaseClient
        .getSupabaseClient()
        .from(this.tableName)
        .update(data)
        .eq(this.primaryKey, id)
        .select(options.returning || '*')
        .maybeSingle();

      if (error) {
        throw new DatabaseError(
          `Failed to update record in ${this.schema}.${this.tableName}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          `UPDATE ${this.schema}.${this.tableName} SET ... WHERE ${this.primaryKey} = ${id}`,
          { id, data },
          this.tableName,
          QueryOperation.UPDATE
        );
      }

      return {
        data: result as T,
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: result ? 1 : 0,
          operation: QueryOperation.UPDATE,
          table: this.tableName,
        },
        error: null,
      };

    } catch (error) {
      return this.handleUpdateError(error, { id, data }, options, Date.now() - startTime);
    }

  }

  /**
   * Delete a record by its primary key
   */

  async delete(id: string | number, options: QueryOptions = {}): Promise<SingleResult<T>> {

    const startTime = Date.now();

    try {

      if (this.debug) {
        console.log(`[TableOperations] Deleting record from ${this.schema}.${this.tableName}`, { id });
      }

      const { data: result, error } = await databaseClient
        .getSupabaseClient()
        .from(this.tableName)
        .delete()
        .eq(this.primaryKey, id)
        .select(options.returning || '*')
        .maybeSingle();

      if (error) {
        throw new DatabaseError(
          `Failed to delete record from ${this.schema}.${this.tableName}: ${error.message}`,
          DatabaseErrorType.QUERY_ERROR,
          error,
          `DELETE FROM ${this.schema}.${this.tableName} WHERE ${this.primaryKey} = ${id}`,
          { id },
          this.tableName,
          QueryOperation.DELETE
        );
      }

      return {
        data: result as T,
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: result ? 1 : 0,
          operation: QueryOperation.DELETE,
          table: this.tableName,
        },
        error: null,
      };

    } catch (error) {
      return this.handleDeleteError(error, { id }, options, Date.now() - startTime);
    }

  }

  /**
   * Batch operations for multiple records
   */

  async batchInsert(records: Partial<T>[], options: QueryOptions = {}): Promise<MutationResult<T>> {

    return this.insert(records, options);
  }

  async batchUpdate(updates: Array<{ id: string | number; data: Partial<T> }>, options: QueryOptions = {}): Promise<QueryResult<T>> {

    const results: T[] = [];

    const errors: DatabaseError[] = [];

    for (const update of updates) {
      try {
        const result = await this.update(update.id, update.data, options);
        if (result.data) {
          results.push(result.data);
        }
        if (result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        errors.push(
          new DatabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            DatabaseErrorType.UNKNOWN_ERROR,
            error
          )
        );
      }
    }

    return {
      data: results,
      metadata: {
        executionTime: 0,
        rowCount: results.length,
        totalCount: results.length,
        operation: QueryOperation.UPDATE,
        table: this.tableName,
      },
      error: errors.length > 0 ? errors[0] : null,

    };
  }

  async batchDelete(ids: (string | number)[], options: QueryOptions = {}): Promise<QueryResult<T>> {

    const results: T[] = [];

    const errors: DatabaseError[] = [];

    for (const id of ids) {
      try {
        const result = await this.delete(id, options);
        if (result.data) {
          results.push(result.data);
        }
        if (result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        errors.push(
          new DatabaseError(
            error instanceof Error ? error.message : 'Unknown error',
            DatabaseErrorType.UNKNOWN_ERROR,
            error
          )
        );
      }
    }

    return {
      data: results,
      metadata: {
        executionTime: 0,
        rowCount: results.length,
        totalCount: results.length,
        operation: QueryOperation.DELETE,
        table: this.tableName,
      },
      error: errors.length > 0 ? errors[0] : null,

    };
  }

  /**
   * Get table information
   */

  getTableInfo() {
    return {
      tableName: this.tableName,
      primaryKey: this.primaryKey,
      schema: this.schema,
      debug: this.debug,
    };
  }

  /**
   * Calculate pagination metadata
   */

  private calculatePaginationMetadata(

    data: any[] | null,

    count: number | null,

    options: QueryOptions

  ): PaginationMetadata {
    let hasMorePages = false;
    let totalPages = 1;
    let page: number | undefined;
    let pageSize: number | undefined;

    if (options.pagination) {
      const { page: requestedPage, pageSize: requestedPageSize, limit } = options.pagination;
      page = requestedPage;
      pageSize = requestedPageSize || limit;

      if (count !== null && count !== undefined && pageSize) {
        totalPages = Math.ceil(count / pageSize);
        if (page !== undefined) {
          hasMorePages = page < totalPages;
        }
      } else if (data && pageSize && data.length === pageSize) {
        hasMorePages = true;
      }
    }

    return {
      page,
      pageSize,
      totalPages,
      hasMorePages,
    };
  }

  /**
   * Handle query errors for list operations
   */

  private handleQueryError(

    error: any,

    operation: QueryOperation,

    context: any,

    executionTime: number

  ): QueryResult<T> {

    if (error instanceof DatabaseError) {
      if (this.debug) {
        console.error(`[TableOperations] Query failed:`, error);
      }
      return {
        data: [],
        metadata: {
          executionTime,
          rowCount: 0,
          totalCount: 0,
          operation,
          table: this.tableName,
        },
        error,
      };
    }

    const dbError = new DatabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      DatabaseErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error : undefined,
      `${operation} operation on ${this.schema}.${this.tableName}`,
      context,
      this.tableName,
      operation
    );

    if (this.debug) {
      console.error(`[TableOperations] Query failed:`, dbError);
    }

    return {
      data: [],
      metadata: {
        executionTime,
        rowCount: 0,
        totalCount: 0,
        operation,
        table: this.tableName,
      },
      error: dbError,
    };

  }

  /**
   * Handle single query errors
   */

  private handleSingleQueryError(

    error: any,

    operation: QueryOperation,

    context: any,

    executionTime: number

  ): SingleResult<T> {

    if (error instanceof DatabaseError) {
      if (this.debug) {
        console.error(`[TableOperations] Single query failed:`, error);
      }
      return {
        data: null,
        metadata: {
          executionTime,
          rowCount: 0,
          operation,
          table: this.tableName,
        },
        error,
      };
    }

    const dbError = new DatabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      DatabaseErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error : undefined,
      `${operation} operation on ${this.schema}.${this.tableName}`,
      context,
      this.tableName,
      operation
    );

    if (this.debug) {
      console.error(`[TableOperations] Single query failed:`, dbError);
    }

    return {
      data: null,
      metadata: {
        executionTime,
        rowCount: 0,
        operation,
        table: this.tableName,
      },
      error: dbError,
    };

  }

  /**
   * Handle mutation errors (insert)
   */

  private handleMutationError(

    error: any,

    operation: QueryOperation,

    context: any,

    options: QueryOptions,

    executionTime: number

  ): MutationResult<T> {

    if (error instanceof DatabaseError) {
      if (this.debug) {
        console.error(`[TableOperations] Mutation failed:`, error);
      }

      if (!options.metaData?.suppressToast) {
        toast.error(`Failed to ${operation.toLowerCase()} record: ${error.message}`);
      }

      return {
        data: [],
        metadata: {
          executionTime,
          rowCount: 0,
          totalCount: 0,
          operation,
          table: this.tableName,
        },
        error,
        count: 0,
      };
    }

    const dbError = new DatabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      DatabaseErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error : undefined,
      `${operation} operation on ${this.schema}.${this.tableName}`,
      context,
      this.tableName,
      operation
    );

    if (this.debug) {
      console.error(`[TableOperations] Mutation failed:`, dbError);
    }

    if (!options.metaData?.suppressToast) {
      toast.error(`Failed to ${operation.toLowerCase()} record: ${dbError.message}`);
    }

    return {
      data: [],
      metadata: {
        executionTime,
        rowCount: 0,
        totalCount: 0,
        operation,
        table: this.tableName,
      },
      error: dbError,
      count: 0,
    };

  }

  /**
   * Handle update errors
   */

  private handleUpdateError(

    error: any,

    context: any,

    options: QueryOptions,

    executionTime: number

  ): SingleResult<T> {

    if (error instanceof DatabaseError) {
      if (this.debug) {
        console.error(`[TableOperations] Update failed:`, error);
      }

      if (!options.metaData?.suppressToast) {
        toast.error(`Failed to update record: ${error.message}`);
      }

      return {
        data: null,
        metadata: {
          executionTime,
          rowCount: 0,
          operation: QueryOperation.UPDATE,
          table: this.tableName,
        },
        error,
      };
    }

    const dbError = new DatabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      DatabaseErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error : undefined,
      `UPDATE operation on ${this.schema}.${this.tableName}`,
      context,
      this.tableName,
      QueryOperation.UPDATE
    );

    if (this.debug) {
      console.error(`[TableOperations] Update failed:`, dbError);
    }

    if (!options.metaData?.suppressToast) {
      toast.error(`Failed to update record: ${dbError.message}`);
    }

    return {
      data: null,
      metadata: {
        executionTime,
        rowCount: 0,
        operation: QueryOperation.UPDATE,
        table: this.tableName,
      },
      error: dbError,
    };

  }

  /**
   * Handle delete errors
   */

  private handleDeleteError(

    error: any,

    context: any,

    options: QueryOptions,

    executionTime: number

  ): SingleResult<T> {

    if (error instanceof DatabaseError) {
      if (this.debug) {
        console.error(`[TableOperations] Delete failed:`, error);
      }

      if (!options.metaData?.suppressToast) {
        toast.error(`Failed to delete record: ${error.message}`);
      }

      return {
        data: null,
        metadata: {
          executionTime,
          rowCount: 0,
          operation: QueryOperation.DELETE,
          table: this.tableName,
        },
        error,
      };
    }

    const dbError = new DatabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      DatabaseErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error : undefined,
      `DELETE operation on ${this.schema}.${this.tableName}`,
      context,
      this.tableName,
      QueryOperation.DELETE
    );

    if (this.debug) {
      console.error(`[TableOperations] Delete failed:`, dbError);
    }

    if (!options.metaData?.suppressToast) {
      toast.error(`Failed to delete record: ${dbError.message}`);
    }

    return {
      data: null,
      metadata: {
        executionTime,
        rowCount: 0,
        operation: QueryOperation.DELETE,
        table: this.tableName,
      },
      error: dbError,
    };

  }

}

/**
 * Create table operations for a specific table
 */
export function createTableOperations<T = any>(
  tableName: string,
  options: TableOperationOptions = {}
): TableOperations<T> {
  return new TableOperations<T>(tableName, options);
}

/**
 * Pre-configured table operations for common tables
 */
export const tablesMap = {
  users: createTableOperations('users'),
  profiles: createTableOperations('profiles'),
  products: createTableOperations('products'),
  orders: createTableOperations('orders'),
  tickets: createTableOperations('tickets'),
  events: createTableOperations('events'),
  messages: createTableOperations('messages'),
  conversations: createTableOperations('conversations'),
  caterers: createTableOperations('caterers'),
  venues: createTableOperations('venues'),
  bookings: createTableOperations('bookings'),
} as const;

export type TableName = keyof typeof tablesMap;

export default TableOperations;