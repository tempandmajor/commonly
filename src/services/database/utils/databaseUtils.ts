/**
 * Database Service - Utilities
 *
 * This file provides utility functions for common database operations.
 */

import { databaseClient } from '../api/databaseClient';
import { createTableOperations } from '../api/tableOperations';
import { transactionManager } from '../api/transactionManager';
import {
  DatabaseOptions,
  QueryOptions,
  QueryResult,
  DatabaseError,
  DatabaseErrorType,
  QueryOperation,
} from '../core/types';

/**
 * Cache for database operations
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

const queryCache = new Map<string, CacheItem<any>>();

/**
 * Generate a cache key from query parameters
 */
export function generateCacheKey(operation: string, tableName: string, params?: any): string {
  return `${operation}:${tableName}:${params ? JSON.stringify(params) : 'all'}`;
}

/**
 * Cache a query result
 */
export function cacheResult<T>(
  key: string,
  data: T,
  ttlMs: number = 60000 // Default: 1 minute
): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + ttlMs,
  });
}

/**
 * Get a cached result if available and not expired
 */
export function getCachedResult<T>(key: string): T | null {
  const cached = queryCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache has expired
  if (Date.now() > cached.expiry) {
    queryCache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Clear all cached results or by specific key pattern
 */
export function clearCache(keyPattern?: string): void {
  if (!keyPattern) {
    queryCache.clear();
    return;
  }

  // Delete keys matching the pattern
  for (const key of queryCache.keys()) {
    if (key.includes(keyPattern)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Execute a query with caching support
 */
export async function cachedQuery<T = any>(
  query: string,
  params: unknown[] = [],
  options: {
    ttlMs?: number;
    bypassCache?: boolean;
    cacheKey?: string;
  } = {}
): Promise<QueryResult<T>> {
  const { ttlMs = 60000, bypassCache = false, cacheKey } = options;

  // Generate cache key if not provided
  const key = cacheKey || generateCacheKey('query', query, params);

  // Check cache unless bypassing
  if (!bypassCache) {
    const cached = getCachedResult<QueryResult<T>>(key);
    if (cached) {
      return cached;
    }
  }

  // Execute the query
  const result = await databaseClient.query<T>(query, params);

  // Cache the result if successful
  if (!result.error) {
    cacheResult(key, result, ttlMs);
  }

  return result;
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(table: string, schema: string = 'public'): Promise<boolean> {
  try {
    const { data, error } = await databaseClient.query(
      `
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = $1 AND tablename = $2
      ) as exists
    `,
      [schema, table]
    );

    if (error) {
      throw error;
    }

    return data?.[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

/**
 * Get count of records in a table with optional filters
 */
export async function getRecordCount(
  table: string,
  filters?: Record<string, unknown>,
  schema: string = 'public'
): Promise<number> {
  try {
    let query = `SELECT COUNT(*) FROM ${schema}.${table}`;
    const params: unknown[] = [];

    // Apply filters if provided

    if (filters && (Object.keys(filters) as (keyof typeof filters)[]).length > 0) {
      const conditions: string[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(filters)) {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }

      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const { data, error } = await databaseClient.query<{ count: number }>(query, params);

    if (error) {
      throw error;
    }

    return parseInt(data?.[0]?.count?.toString() || '0', 10);
  } catch (error) {
    return 0;
  }
}

/**
 * Check if a record exists by a specific field value
 */
export async function recordExists(
  table: string,
  field: string,
  value: unknown,
  schema: string = 'public'
): Promise<boolean> {
  try {
    const { data, error } = await databaseClient.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM ${schema}.${table} WHERE ${field} = $1
      ) as exists
    `,
      [value]
    );

    if (error) {
      throw error;
    }

    return data?.[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

/**
 * Upsert a record (insert or update)
 */
export async function upsertRecord<T = any>(
  table: string,
  data: Partial<T>,
  conflictFields: string | string[],
  schema: string = 'public',
  options: { returning?: string; updateFields?: string[] } = {}
): Promise<T | null> {
  try {
    const { returning = '*', updateFields } = options;
    const tableOps = createTableOperations<T>(table, { schema });
    const fields = Object.keys(data) as (keyof typeof data)[];
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`);

    // Format conflict fields
    const conflictColumns = Array.isArray(conflictFields)
      ? conflictFields.join(', ')
      : conflictFields;

    // Determine which fields to update (default: all fields except conflict fields)
    const conflictFieldsArr = Array.isArray(conflictFields) ? conflictFields : [conflictFields];

    const fieldsToUpdate = updateFields || fields.filter(f => !conflictFieldsArr.includes(f));

    // Build the SET clause for updates
    const setClause = fieldsToUpdate.map(field => `${field} = EXCLUDED.${field}`).join(', ');

    // Build the upsert query
    let query = `
      INSERT INTO ${schema}.${table} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${conflictColumns})
    `;

    if (fieldsToUpdate.length > 0) {
      query += ` DO UPDATE SET ${setClause}`;
    } else {
      query += ' DO NOTHING';
    }

    if (returning) {
      query += ` RETURNING ${returning}`;
    }

    const { data: result, error } = await databaseClient.query<T>(query, values);

    if (error) {
      throw error;
    }

    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    const dbError =
      error instanceof DatabaseError
        ? error
        : new DatabaseError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            DatabaseErrorType.UNKNOWN_ERROR,
            error instanceof Error ? error : undefined,
            'Upsert record',
            { table, data, conflictFields },
            table,
            QueryOperation.UPSERT
          );

    throw dbError;
  }
}

/**
 * Batch insert multiple records
 */
export async function batchInsert<T = any>(
  table: string,
  records: Partial<T>[],
  schema: string = 'public',
  options: { batchSize?: number; returning?: string } = {}
): Promise<T[]> {
  const { batchSize = 100, returning = '*' } = options;

  if (!records || records.length === 0) {
    return [];
  }

  try {
    // Start a transaction
    const tx = transactionManager;
    await tx.begin();

    const results: T[] = [];

    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      if (batch.length === 0) continue;

      // All records must have the same fields

      const fields = (Object.keys(batch[0] || {})) as (keyof typeof batch[0])[];

      if (fields.length === 0) continue;

      // Generate placeholders for each record
      const valuePlaceholders = [];
      const values = [];
      let paramIndex = 1;

      for (const record of batch) {
        const recordPlaceholders = [];

        for (const field of fields) {
          recordPlaceholders.push(`$${paramIndex}`);
          values.push((record as unknown)[field]);
          paramIndex++;
        }

        valuePlaceholders.push(`(${recordPlaceholders.join(', ')})`);
      }

      // Build the query
      const query = `
        INSERT INTO ${schema}.${table} (${fields.join(', ')})
        VALUES ${valuePlaceholders.join(', ')}
        ${returning ? `RETURNING ${returning}` : ''}
      `;

      // Execute the batch insert
      const batchResults = await tx.query<T>(query, values);
      results.push(...batchResults);
    }

    // Commit the transaction
    await tx.commit();

    return results;
  } catch (error) {
    // Rollback on error
    await transactionManager.rollback().catch(console.error);

    const dbError =
      error instanceof DatabaseError
        ? error
        : new DatabaseError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            DatabaseErrorType.UNKNOWN_ERROR,
            error instanceof Error ? error : undefined,
            'Batch insert',
            { table, recordCount: records.length },
            table,
            QueryOperation.INSERT
          );

    throw dbError;
  }
}

/**
 * Execute operations in a transaction
 */
export async function withTransaction<T = any>(
  operations: (tx: typeof transactionManager) => Promise<T>
): Promise<T> {
  try {
    // Start a transaction
    await transactionManager.begin();

    // Execute operations
    const result = await operations(transactionManager);

    // Commit the transaction
    await transactionManager.commit();

    return result;
  } catch (error) {
    // Rollback on error
    await transactionManager.rollback().catch(console.error);

    const dbError =
      error instanceof DatabaseError
        ? error
        : new DatabaseError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            DatabaseErrorType.UNKNOWN_ERROR,
            error instanceof Error ? error : undefined,
            'Transaction',
            {},
            undefined,
            QueryOperation.RPC
          );

    throw dbError;
  }
}

/**
 * Get database schema information
 */
export async function getSchemaInfo(
  schema: string = 'public'
): Promise<{ tables: string[]; views: string[] }> {
  try {
    // Get tables
    const tablesQuery = await databaseClient.query<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `,
      [schema]
    );

    // Get views
    const viewsQuery = await databaseClient.query<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = $1
      ORDER BY table_name
    `,
      [schema]
    );

    return {
      tables: tablesQuery.error ? [] : tablesQuery.data.map(t => t.table_name),
      views: viewsQuery.error ? [] : viewsQuery.data.map(v => v.table_name),
    };
  } catch (error) {
    return { tables: [], views: [] };
  }
}

/**
 * Format a value for SQL insertion (helps prevent SQL injection)
 */
export function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  if (Array.isArray(value)) {
    return `ARRAY[${value.map(formatSqlValue).join(', ')}]`;
  }

  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }

  // String value - escape single quotes

  return `'${String(value).replace(/'/g, "''")}'`;

}

/**
 * Format a SQL WHERE clause from filters object
 */
export function formatWhereClause(
  filters: Record<string, unknown>,
  startParamIndex: number = 1
): { whereClause: string; params: unknown[]; nextParamIndex: number } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = startParamIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      conditions.push(`${key} IS NULL`);
    } else if (value === undefined) {
      // Skip undefined values
      continue;
    } else {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    whereClause,
    params,
    nextParamIndex: paramIndex,
  };
}

export const databaseUtils = {
  generateCacheKey,
  cacheResult,
  getCachedResult,
  clearCache,
  cachedQuery,
  tableExists,
  getRecordCount,
  recordExists,
  upsertRecord,
  batchInsert,
  withTransaction,
  getSchemaInfo,
  formatSqlValue,
  formatWhereClause,
};
