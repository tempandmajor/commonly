/**
 * Database Service - React Hooks
 *
 * This file provides React hooks for using the database service in components.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { databaseClient } from '../api/databaseClient';
import { createTableOperations } from '../api/tableOperations';
import {
  QueryOptions,
  QueryResult,
  SingleResult,
  MutationResult,
  DatabaseQueryResult,
  DatabaseErrorType,
} from '../core/types';

/**
 * Hook to query data from a table
 */
export function useTableQuery<T = any>(
  tableName: string,
  options: QueryOptions = {},
  queryKey: unknown[] = []
): DatabaseQueryResult<T[]> {
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  const result = useQuery({
    queryKey: [`table:${tableName}`, ...queryKey, options],
    queryFn: async () => {
      const result = await tableOps.findAll(options);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
  });

  return {
    data: result.data,
    error: result.error || null,
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    status: result.status,
    refetch: result.refetch,
  };
}

/**
 * Hook to get a record by ID
 */
export function useRecordById<T = any>(
  tableName: string,
  id: string | number | null | undefined,
  options: QueryOptions = {}
): DatabaseQueryResult<T> {
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  const result = useQuery({
    queryKey: [`${tableName}:${id}`, options],
    queryFn: async () => {
      if (!id) {
        return null;
      }

      const result = await tableOps.findById(id, options);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    enabled: !!id,
  });

  return {
    data: result.data,
    error: result.error || null,
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    status: result.status,
    refetch: result.refetch,
  };
}

/**
 * Hook to query data by a specific field value
 */
export function useRecordsByField<T = any>(
  tableName: string,
  field: string,
  value: unknown,
  options: QueryOptions = {}
): DatabaseQueryResult<T[]> {
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  const result = useQuery({
    queryKey: [`${tableName}:${field}:${value}`, options],
    queryFn: async () => {
      if (value === undefined || value === null) {
        return [];
      }

      const result = await tableOps.findByField(field, value, options);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    enabled: value !== undefined && value !== null,
  });

  return {
    data: result.data || [],
    error: result.error || null,
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    status: result.status,
    refetch: result.refetch,
  };
}

/**
 * Hook to create a new record
 */
export function useCreateRecord<T = any>(
  tableName: string,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    schema?: string;
    debug?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const result = await tableOps.insert(data);

      if (result.error) {
        throw result.error;
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('Failed to create record - no data returned');
      }

      return result.data[0];
    },
    onSuccess: data => {
      // Invalidate queries for this table
      queryClient.invalidateQueries({ queryKey: [`table:${tableName}`] });

      toast.success('Record created successfully');

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create record: ${error.message}`);

      if (options.onError) {
        options.onError(error);
      }
    },
  });

  return {
    createRecord: mutation.mutate,
    createRecordAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}

/**
 * Hook to update a record
 */
export function useUpdateRecord<T = any>(
  tableName: string,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    schema?: string;
    debug?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<T> }) => {
      const result = await tableOps.update(id, data);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific queries
      queryClient.invalidateQueries({ queryKey: [`table:${tableName}`] });
      queryClient.invalidateQueries({ queryKey: [`${tableName}:${variables.id}`] });

      toast.success('Record updated successfully');

      if (options.onSuccess && data) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update record: ${error.message}`);

      if (options.onError) {
        options.onError(error);
      }
    },
  });

  return {
    updateRecord: mutation.mutate,
    updateRecordAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}

/**
 * Hook to delete a record
 */
export function useDeleteRecord<T = any>(
  tableName: string,
  options: {
    onSuccess?: (id: string | number) => void;
    onError?: (error: Error) => void;
    schema?: string;
    debug?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  const mutation = useMutation({
    mutationFn: async (id: string | number) => {
      const result = await tableOps.delete(id);

      if (result.error) {
        throw result.error;
      }

      return id;
    },
    onSuccess: id => {
      // Invalidate specific queries
      queryClient.invalidateQueries({ queryKey: [`table:${tableName}`] });
      queryClient.invalidateQueries({ queryKey: [`${tableName}:${id}`] });

      toast.success('Record deleted successfully');

      if (options.onSuccess) {
        options.onSuccess(id);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete record: ${error.message}`);

      if (options.onError) {
        options.onError(error);
      }
    },
  });

  return {
    deleteRecord: mutation.mutate,
    deleteRecordAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}

/**
 * Hook to execute a raw SQL query
 */
export function useRawQuery<T = any>(
  query: string,
  params: unknown[] = [],
  options: { enabled?: boolean; refetchInterval?: number } = {}
): DatabaseQueryResult<T[]> {
  const result = useQuery({
    queryKey: ['raw-query', query, params],
    queryFn: async () => {
      const result = await databaseClient.query<T>(query, params);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval,
  });

  return {
    data: result.data || [],
    error: result.error || null,
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    status: result.status,
    refetch: result.refetch,
  };
}

/**
 * Hook for paginated queries with cursor-based pagination
 */
export function usePaginatedQuery<T = any>(
  tableName: string,
  options: QueryOptions & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const [page, setPage] = useState(options.initialPage || 1);
  const [pageSize, setPageSize] = useState(options.pageSize || 10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
  });

  // Prepare the pagination options
  const paginationOptions: QueryOptions = {
          ...options,
    pagination: {
      page,
      pageSize,
    },
  };

  // Use the query hook
  const result = useQuery({
    queryKey: [`paginated:${tableName}`, page, pageSize, options],
    queryFn: async () => {
      const result = await tableOps.findAll(paginationOptions);

      if (result.error) {
        throw result.error;
      }

      // Update pagination state
      if (result.metadata.totalPages !== undefined) {
        setTotalPages(result.metadata.totalPages);
      }

      if (result.metadata.totalCount !== undefined) {
        setTotalCount(result.metadata.totalCount || 0);
      }

      return result.data;
    },
  });

  // Navigation functions
  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  return {
    data: result.data || [],
    error: result.error || null,
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    status: result.status,
    refetch: result.refetch,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalCount,
      goToPage,
      nextPage,
      previousPage,
      changePageSize,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Hook to work with a specific table, providing all CRUD operations
 */
export function useTable<T = any>(
  tableName: string,
  options: {
    schema?: string;
    debug?: boolean;
    idField?: string;
    initialQueryOptions?: QueryOptions;
  } = {}
) {
  const { idField = 'id', initialQueryOptions = {} } = options;
  const tableOps = createTableOperations<T>(tableName, {
    schema: options.schema,
    debug: options.debug,
    primaryKey: idField,
  });

  const queryClient = useQueryClient();

  // State for query parameters
  const [queryOptions, setQueryOptions] = useState<QueryOptions>(initialQueryOptions);

  // Query hook for the table data
  const query = useTableQuery<T>(tableName, queryOptions, ['table-hook']);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const result = await tableOps.insert(data);

      if (result.error) {
        throw result.error;
      }

      return result.data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`table:${tableName}`, 'table-hook'] });
      toast.success('Record created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create record: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<T> }) => {
      const result = await tableOps.update(id, data);

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`table:${tableName}`, 'table-hook'] });
      queryClient.invalidateQueries({ queryKey: [`${tableName}:${variables.id}`] });
      toast.success('Record updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update record: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const result = await tableOps.delete(id);

      if (result.error) {
        throw result.error;
      }

      return id;
    },
    onSuccess: id => {
      queryClient.invalidateQueries({ queryKey: [`table:${tableName}`, 'table-hook'] });
      queryClient.invalidateQueries({ queryKey: [`${tableName}:${id}`] });
      toast.success('Record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete record: ${error.message}`);
    },
  });

  // Get record by id (outside query system)
  const getById = useCallback(
    async (id: string | number): Promise<T | null> => {
      const result = await tableOps.findById(id);
      return result.error ? null : result.data;
    },
    [tableOps]
  );

  // Update the query options
  const updateQuery = useCallback((newOptions: QueryOptions) => {
    setQueryOptions(prev => ({
          ...prev,
          ...newOptions,
    }));
  }, []);

  return {
    data: query.data || [],
    error: query.error,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,

    // CRUD operations
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Additional helpers
    getById,
    updateQuery,
    queryOptions,
  };
}
