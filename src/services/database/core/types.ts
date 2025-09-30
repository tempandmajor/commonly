/**
 * Database Service - Core Types
 *
 * This file defines the core types and interfaces for the database service.
 */

import {
  PostgrestError,
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js';
import { QueryData } from '@tanstack/react-query';

/**
 * Database schemas
 */
export enum DatabaseSchema {
  PUBLIC = 'public',
  AUTH = 'auth',
  STORAGE = 'storage',
  ANALYTICS = 'analytics',
}

/**
 * Database query operation types
 */
export enum QueryOperation {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  UPSERT = 'UPSERT',
  RPC = 'RPC',
}

/**
 * Database error types
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'connection_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  PERMISSION_ERROR = 'permission_error',
  CONSTRAINT_ERROR = 'constraint_error',
  NOT_FOUND_ERROR = 'not_found_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  QUERY_ERROR = 'query_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Database error class
 */
export class DatabaseError extends Error {
  public readonly type: DatabaseErrorType;
  public readonly originalError?: Error | PostgrestError;
  public readonly query?: string;
  public readonly params?: unknown;
  public readonly table?: string;
  public readonly operation?: QueryOperation;
  public readonly code?: string;
  public readonly hint?: string;

  constructor(
    message: string,
    type: DatabaseErrorType = DatabaseErrorType.UNKNOWN_ERROR,
    originalError?: Error | PostgrestError,
    query?: string,
    params?: unknown,
    table?: string,
    operation?: QueryOperation
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.originalError = originalError;
    this.query = query;
    this.params = params;
    this.table = table;
    this.operation = operation;

    if (originalError && 'code' in originalError) {
      this.code = originalError.code;
      this.hint = originalError.hint;
    }
  }
}

/**
 * Transaction mode
 */
export enum TransactionMode {
  READ_WRITE = 'READ WRITE',
  READ_ONLY = 'READ ONLY',
  SERIALIZABLE = 'SERIALIZABLE',
}

/**
 * Database operation options
 */
export interface DatabaseOptions {
  schema?: string | undefined;
  timeout?: number | undefined;
  debug?: boolean | undefined;
  metaData?: Record<string, unknown> | undefined;
  bypassRLS?: boolean | undefined;
  returning?: 'minimal' | undefined| 'representation';
  count?: 'exact' | undefined| 'planned' | 'estimated';
  head?: boolean | undefined;
}

/**
 * Query parameters for filtering
 */
export interface QueryFilters {
  eq?: Record<string, unknown> | undefined;
  neq?: Record<string, unknown> | undefined;
  gt?: Record<string, unknown> | undefined;
  gte?: Record<string, unknown> | undefined;
  lt?: Record<string, unknown> | undefined;
  lte?: Record<string, unknown> | undefined;
  like?: Record<string, string> | undefined;
  ilike?: Record<string, string> | undefined;
  is?: Record<string, boolean | undefined| null>;
  in?: Record<string, any[]> | undefined;
  contains?: Record<string, unknown> | undefined;
  containedBy?: Record<string, unknown> | undefined;
  rangeGt?: Record<string, unknown> | undefined;
  rangeGte?: Record<string, unknown> | undefined;
  rangeLt?: Record<string, unknown> | undefined;
  rangeLte?: Record<string, unknown> | undefined;
  rangeAdjacent?: Record<string, unknown> | undefined;
  textSearch?: Record<string, unknown> | undefined;
  match?: Record<string, unknown> | undefined;
}

/**
 * Query order options
 */
export interface QueryOrder {
  column: string;
  ascending?: boolean | undefined;
  nullsFirst?: boolean | undefined;
  foreignTable?: string | undefined;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number | undefined;
  pageSize?: number | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  cursor?: string | undefined;
}

/**
 * Database query options
 */
export interface QueryOptions extends DatabaseOptions {
  filters?: QueryFilters;
  order?: QueryOrder[];
  pagination?: PaginationOptions;
  select?: string | string[];
  columns?: string | string[];
  returning?: string | string[];
  upsert?: boolean;
}

/**
 * Query result metadata
 */
export interface QueryMetadata {
  executionTime?: number | undefined;
  rowCount?: number | undefined;
  totalCount?: number | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  totalPages?: number | undefined;
  hasMorePages?: boolean | undefined;
  nextCursor?: string | undefined;
  prevCursor?: string | undefined;
  query?: string | undefined;
  operation?: QueryOperation | undefined;
  table?: string | undefined;
}

/**
 * Database query result
 */
export interface QueryResult<T> {
  data: T[];
  metadata: QueryMetadata;
  error: DatabaseError | null;
}

/**
 * Database single result
 */
export interface SingleResult<T> {
  data: T | null;
  metadata: QueryMetadata;
  error: DatabaseError | null;
}

/**
 * Database mutation result
 */
export interface MutationResult<T> {
  data: T[];
  metadata: QueryMetadata;
  error: DatabaseError | null;
  count?: number;
}

/**
 * RLS policy type
 */
export enum RlsPolicyType {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ALL = 'ALL',
}

/**
 * RLS policy definition
 */
export interface RlsPolicy {
  name: string;
  table: string;
  schema: string;
  action: RlsPolicyType;
  definition: string;
  check: string;
  roles?: string[] | undefined;
}

/**
 * Database table type definition with column metadata
 */
export interface TableDefinition {
  name: string;
  schema: string;
  columns: ColumnDefinition[];
  primaryKey?: string[] | undefined;
  foreignKeys?: ForeignKeyDefinition[] | undefined;
  indexes?: IndexDefinition[] | undefined;
  hasRLS: boolean;
  policies?: RlsPolicy[] | undefined;
}

/**
 * Column definition
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  defaultValue?: unknown | undefined;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  comment?: string | undefined;
}

/**
 * Foreign key definition
 */
export interface ForeignKeyDefinition {
  columns: string[];
  foreignTable: string;
  foreignSchema: string;
  foreignColumns: string[];
  onDelete?: string | undefined;
  onUpdate?: string | undefined;
}

/**
 * Index definition
 */
export interface IndexDefinition {
  name: string;
  columns: string[];
  isUnique: boolean;
  predicate?: string | undefined;
}

/**
 * Types for React Query integration
 */
export interface DatabaseQueryResult<TData = unknown, TError = DatabaseError> {
  data?: TData;
  error: TError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  status: 'error' | 'success' | 'loading';
  refetch: () => Promise<QueryData<TData, TError>>;
}

/**
 * Transaction manager interface
 */
export interface TransactionManager {
  begin: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  query: <T>(query: string, params?: unknown[]) => Promise<T[]> | undefined;
}
