/**
 * Database Service - Backward Compatibility Layer
 *
 * This file provides backward compatibility with legacy database service functions.
 * All functions here are marked as deprecated and will eventually be removed.
 */

import { databaseClient } from '../api/databaseClient';
import { createTableOperations } from '../api/tableOperations';
import { transactionManager } from '../api/transactionManager';
import { databaseUtils } from '../utils/databaseUtils';
import { QueryOptions } from '../core/types';

/**
 * @deprecated Use databaseClient.query or appropriate hooks instead
 */
export async function executeQuery(query: string, params: unknown[] = []) {
  const result = await databaseClient.query(query, params);
  return {
    data: result.data,
    error: result.error,
  };
}

/**
 * @deprecated Use databaseClient.select or appropriate hooks instead
 */
export async function fetchTable(table: string, options: Record<string, unknown> = {}) {
  try {
    const queryOptions: QueryOptions = {
      filters: options.filters,
      order: options.orderBy
        ? [{ column: options.orderBy, ascending: options.ascending !== false }]
        : undefined,
      pagination: options.limit ? { limit: options.limit, offset: options.offset } : undefined,
    };

    const tableOps = createTableOperations(table);
    const result = await tableOps.findAll(queryOptions);

    return {
      data: result.data,
      error: result.error,
      count: result.metadata.totalCount,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
      count: 0,
    };
  }
}

/**
 * @deprecated Use databaseClient.getById or useRecordById hook instead
 */
export async function getRecordById(table: string, id: string | number) {
  try {
    const tableOps = createTableOperations(table);
    const result = await tableOps.findById(id);

    return {
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use databaseClient.insert or useCreateRecord hook instead
 */
export async function insertRecord(table: string, data: unknown) {
  try {
    const tableOps = createTableOperations(table);
    const result = await tableOps.insert(data);

    return {
      data: result.data?.[0] || null,
      error: result.error,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use databaseClient.update or useUpdateRecord hook instead
 */
export async function updateRecord(table: string, id: string | number, data: unknown) {
  try {
    const tableOps = createTableOperations(table);
    const result = await tableOps.update(id, data);

    return {
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use databaseClient.delete or useDeleteRecord hook instead
 */
export async function deleteRecord(table: string, id: string | number) {
  try {
    const tableOps = createTableOperations(table);
    const result = await tableOps.delete(id);

    return {
      data: result.data,
      error: result.error,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use withTransaction from databaseUtils instead
 */
export async function runTransaction(callback: Function) {
  try {
    await transactionManager.begin();
    const result = await callback(transactionManager);
    await transactionManager.commit();
    return { data: result, error: null };
  } catch (error) {
    await transactionManager.rollback().catch(console.error);
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use recordExists from databaseUtils instead
 */
export async function checkRecordExists(table: string, column: string, value: unknown) {
  try {
    const exists = await databaseUtils.recordExists(table, column, value);
    return { exists, error: null };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use tableExists from databaseUtils instead
 */
export async function checkTableExists(table: string, schema = 'public') {
  try {
    const exists = await databaseUtils.tableExists(table, schema);
    return { exists, error: null };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use getRecordCount from databaseUtils instead
 */
export async function countRecords(table: string, filters = {}) {
  try {
    const count = await databaseUtils.getRecordCount(table, filters);
    return { count, error: null };
  } catch (error) {
    return {
      count: 0,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use upsertRecord from databaseUtils instead
 */
export async function upsertRecord(
  table: string,
  data: unknown,
  conflictFields: string | string[]
) {
  try {
    const result = await databaseUtils.upsertRecord(table, data, conflictFields);
    return { data: result, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use cachedQuery from databaseUtils instead
 */
export async function getCachedQuery(query: string, params: unknown[] = [], ttlMs = 60000) {
  try {
    const result = await databaseUtils.cachedQuery(query, params, { ttlMs });
    return { data: result.data, error: result.error };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error) as string,
    };
  }
}

/**
 * @deprecated Use clearCache from databaseUtils instead
 */
export function invalidateCache(pattern?: string) {
  databaseUtils.clearCache(pattern);
  return { success: true };
}

/**
 * @deprecated Use client.from().select() or tableOperations instead
 */
export function queryBuilder(table: string) {
  const client = databaseClient.getSupabaseClient();
  return client.from(table);
}
