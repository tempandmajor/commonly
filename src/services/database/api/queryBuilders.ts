/**
 * Database Service - Query Builders
 *
 * This file provides utility functions for building complex database queries.
 */

import {
  QueryFilters,
  QueryOrder,
  PaginationOptions,
  QueryOptions,
  DatabaseOptions,
} from '../core/types';
import { PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';

/**
 * Apply filters to a query
 */
export function applyFilters<T>(
  query: PostgrestFilterBuilder<any, any, T>,
  filters: QueryFilters
): PostgrestFilterBuilder<any, any, T> {
  let filteredQuery = query;

  // Apply equality filters
  if (filters.eq) {
    Object.entries(filters.eq).forEach(([column, value]) => {
      filteredQuery = filteredQuery.eq(column, value);
    });
  }

  // Apply inequality filters
  if (filters.neq) {
    Object.entries(filters.neq).forEach(([column, value]) => {
      filteredQuery = filteredQuery.neq(column, value);
    });
  }

  // Apply greater than filters
  if (filters.gt) {
    Object.entries(filters.gt).forEach(([column, value]) => {
      filteredQuery = filteredQuery.gt(column, value);
    });
  }

  // Apply greater than or equal filters
  if (filters.gte) {
    Object.entries(filters.gte).forEach(([column, value]) => {
      filteredQuery = filteredQuery.gte(column, value);
    });
  }

  // Apply less than filters
  if (filters.lt) {
    Object.entries(filters.lt).forEach(([column, value]) => {
      filteredQuery = filteredQuery.lt(column, value);
    });
  }

  // Apply less than or equal filters
  if (filters.lte) {
    Object.entries(filters.lte).forEach(([column, value]) => {
      filteredQuery = filteredQuery.lte(column, value);
    });
  }

  // Apply LIKE filters
  if (filters.like) {
    Object.entries(filters.like).forEach(([column, value]) => {
      filteredQuery = filteredQuery.like(column, value);
    });
  }

  // Apply ILIKE (case-insensitive LIKE) filters
  if (filters.ilike) {
    Object.entries(filters.ilike).forEach(([column, value]) => {
      filteredQuery = filteredQuery.ilike(column, value);
    });
  }

  // Apply IS filters
  if (filters.is) {
    Object.entries(filters.is).forEach(([column, value]) => {
      filteredQuery = filteredQuery.is(column, value);
    });
  }

  // Apply IN filters
  if (filters.in) {
    Object.entries(filters.in).forEach(([column, values]) => {
      filteredQuery = filteredQuery.in(column, values);
    });
  }

  // Apply contains filters (for arrays and jsonb)
  if (filters.contains) {
    Object.entries(filters.contains).forEach(([column, value]) => {
      filteredQuery = filteredQuery.contains(column, value);
    });
  }

  // Apply containedBy filters (for arrays and jsonb)
  if (filters.containedBy) {
    Object.entries(filters.containedBy).forEach(([column, value]) => {
      filteredQuery = filteredQuery.containedBy(column, value);
    });
  }

  // Apply range greater than filters
  if (filters.rangeGt) {
    Object.entries(filters.rangeGt).forEach(([column, value]) => {
      filteredQuery = filteredQuery.rangeGt(column, value);
    });
  }

  // Apply range greater than or equal filters
  if (filters.rangeGte) {
    Object.entries(filters.rangeGte).forEach(([column, value]) => {
      filteredQuery = filteredQuery.rangeGte(column, value);
    });
  }

  // Apply range less than filters
  if (filters.rangeLt) {
    Object.entries(filters.rangeLt).forEach(([column, value]) => {
      filteredQuery = filteredQuery.rangeLt(column, value);
    });
  }

  // Apply range less than or equal filters
  if (filters.rangeLte) {
    Object.entries(filters.rangeLte).forEach(([column, value]) => {
      filteredQuery = filteredQuery.rangeLte(column, value);
    });
  }

  // Apply range adjacent filters
  if (filters.rangeAdjacent) {
    Object.entries(filters.rangeAdjacent).forEach(([column, value]) => {
      filteredQuery = filteredQuery.rangeAdjacent(column, value);
    });
  }

  // Apply text search filters
  if (filters.textSearch) {
    Object.entries(filters.textSearch).forEach(([column, value]) => {
      filteredQuery = filteredQuery.textSearch(column, value);
    });
  }

  // Apply MATCH filters (for full-text search)
  if (filters.match) {
    Object.entries(filters.match).forEach(([column, value]) => {
      filteredQuery = filteredQuery.match(column, value);
    });
  }

  return filteredQuery;
}

/**
 * Apply ordering to a query
 */
export function applyOrder<T>(
  query: PostgrestFilterBuilder<any, any, T>,
  order: QueryOrder[]
): PostgrestFilterBuilder<any, any, T> {
  let orderedQuery = query;

  order.forEach(orderItem => {
    const { column, ascending = true, nullsFirst = false, foreignTable } = orderItem;

    if (foreignTable) {
      orderedQuery = orderedQuery.order(`${foreignTable}.${column}`, {
        ascending,
        nullsFirst,
      });
    } else {
      orderedQuery = orderedQuery.order(column, {
        ascending,
        nullsFirst,
      });
    }
  });

  return orderedQuery;
}

/**
 * Apply pagination to a query
 */
export function applyPagination<T>(
  query: PostgrestFilterBuilder<any, any, T>,
  pagination: PaginationOptions
): PostgrestFilterBuilder<any, any, T> {
  let paginatedQuery = query;

  // Handle limit/offset pagination
  if (pagination.limit !== undefined) {
    paginatedQuery = paginatedQuery.limit(pagination.limit);
  }

  if (pagination.offset !== undefined) {
    paginatedQuery = paginatedQuery.range(
      pagination.offset,
      pagination.offset + (pagination.limit || 10) - 1
    );
  }

  // Handle page/pageSize pagination
  else if (pagination.page !== undefined && pagination.pageSize !== undefined) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    paginatedQuery = paginatedQuery.range(from, to);
  }

  return paginatedQuery;
}

/**
 * Build a complete query from options
 */
export function buildQuery<T>(
  query: PostgrestQueryBuilder<any, any, T>,
  options: QueryOptions = {}
): PostgrestFilterBuilder<any, any, T> {
  let builtQuery;

  // Apply column selection
  const columns = options.select || options.columns || '*';
  builtQuery = query.select(columns, {
    count: options.count,
    head: options.head,
  });

  // Apply filters
  if (options.filters) {
    builtQuery = applyFilters(builtQuery, options.filters);
  }

  // Apply order
  if (options.order && options.order.length > 0) {
    builtQuery = applyOrder(builtQuery, options.order);
  }

  // Apply pagination
  if (options.pagination) {
    builtQuery = applyPagination(builtQuery, options.pagination);
  }

  return builtQuery;
}

/**
 * Convert page/pageSize pagination to Postgres range values
 */
export function paginationToRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Build a full-text search query
 */
export function buildFullTextSearch(columns: string[], searchTerm: string): string {
  // Format columns for tsvector
  const tsvColumns = columns.map(col => `coalesce(${col}, '')`).join(" || ' ' || ");

  // Create the search query
  return `to_tsvector('english', ${tsvColumns}) @@ to_tsquery('english', '${prepareSearchTerm(searchTerm)}')`;
}

/**
 * Prepare a search term for full-text search
 */
export function prepareSearchTerm(searchTerm: string): string {
  // Remove special characters
  const prepared = searchTerm.replace(/[^\w\s]/gi, '');

  // Split into words and join with '&' for AND search
  return prepared
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');
}

/**
 * Generate "WHERE" clause from filters
 */
export function filtersToWhere(filters: QueryFilters): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Process equality filters
  if (filters.eq) {
    Object.entries(filters.eq).forEach(([column, value]) => {
      conditions.push(`${column} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process inequality filters
  if (filters.neq) {
    Object.entries(filters.neq).forEach(([column, value]) => {
      conditions.push(`${column} <> $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process greater than filters
  if (filters.gt) {
    Object.entries(filters.gt).forEach(([column, value]) => {
      conditions.push(`${column} > $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process greater than or equal filters
  if (filters.gte) {
    Object.entries(filters.gte).forEach(([column, value]) => {
      conditions.push(`${column} >= $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process less than filters
  if (filters.lt) {
    Object.entries(filters.lt).forEach(([column, value]) => {
      conditions.push(`${column} < $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process less than or equal filters
  if (filters.lte) {
    Object.entries(filters.lte).forEach(([column, value]) => {
      conditions.push(`${column} <= $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process LIKE filters
  if (filters.like) {
    Object.entries(filters.like).forEach(([column, value]) => {
      conditions.push(`${column} LIKE $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process ILIKE filters
  if (filters.ilike) {
    Object.entries(filters.ilike).forEach(([column, value]) => {
      conditions.push(`${column} ILIKE $${paramIndex}`);
      params.push(value);
      paramIndex++;
    });
  }

  // Process IS filters
  if (filters.is) {
    Object.entries(filters.is).forEach(([column, value]) => {
      if (value === null) {
        conditions.push(`${column} IS NULL`);
      } else {
        conditions.push(`${column} IS $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });
  }

  // Process IN filters
  if (filters.in) {
    Object.entries(filters.in).forEach(([column, values]) => {
      const placeholders = [];
      for (let i = 0; i < values.length; i++) {
        placeholders.push(`$${paramIndex}`);
        params.push(values[i]);
        paramIndex++;
      }
      conditions.push(`${column} IN (${placeholders.join(', ')})`);
    });
  }

  // Join all conditions with AND
  return {
    clause: conditions.length ? conditions.join(' AND ') : '',
    params,
  };
}

/**
 * Generate "ORDER BY" clause from order array
 */
export function orderToSql(order: QueryOrder[]): string {
  if (!order || order.length === 0) return '';

  const orderTerms = order.map(orderItem => {
    const { column, ascending = true, nullsFirst = false, foreignTable } = orderItem;
    const columnName = foreignTable ? `${foreignTable}.${column}` : column;
    const direction = ascending ? 'ASC' : 'DESC';
    const nullsOrder = nullsFirst ? 'NULLS FIRST' : 'NULLS LAST';

    return `${columnName} ${direction} ${nullsOrder}`;
  });

  return `ORDER BY ${orderTerms.join(', ')}`;
}

/**
 * Generate pagination limit/offset SQL from pagination options
 */
export function paginationToSql(pagination?: PaginationOptions): string {
  if (!pagination) return '';

  let sql = '';

  // Handle direct limit
  if (pagination.limit !== undefined) {
    sql += ` LIMIT ${pagination.limit}`;
  }
  // Or use page size
  else if (pagination.pageSize !== undefined) {
    sql += ` LIMIT ${pagination.pageSize}`;
  }

  // Handle direct offset
  if (pagination.offset !== undefined) {
    sql += ` OFFSET ${pagination.offset}`;
  }
  // Or calculate from page/pageSize
  else if (pagination.page !== undefined && pagination.pageSize !== undefined) {
    const offset = (pagination.page - 1) * pagination.pageSize;
    sql += ` OFFSET ${offset}`;
  }

  return sql;
}

// Export all query builder functions
export const queryBuilders = {
  applyFilters,
  applyOrder,
  applyPagination,
  buildQuery,
  paginationToRange,
  buildFullTextSearch,
  prepareSearchTerm,
  filtersToWhere,
  orderToSql,
  paginationToSql,
};
