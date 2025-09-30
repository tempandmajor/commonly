/**
 * Unit Tests for Database Client
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, databaseClient } from '../api/databaseClient';
import { toast } from 'sonner';
import { DatabaseErrorType, QueryOperation } from '../core/types';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabaseQuery),
    rpc: vi.fn(() => mockSupabaseRpc),
  })),
}));

// Mock Supabase query builder
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
  then: vi.fn(),
};

// Mock Supabase RPC
const mockSupabaseRpc = {
  then: vi.fn(),
};

describe('DatabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('query', () => {
    it('should execute a raw SQL query successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'Test' }],
        error: null,
        count: 1,
      };
      mockSupabaseRpc.then.mockImplementation(callback => callback(mockResponse));

      const result = await databaseClient.query('SELECT * FROM test_table');

      expect(result.data).toEqual([{ id: 1, name: 'Test' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
      expect(result.metadata.operation).toBe(QueryOperation.RPC);
    });

    it('should handle query errors', async () => {
      // Mock error response
      const mockError = {
        message: 'Query error',
        code: '42P01',
      };
      mockSupabaseRpc.then.mockImplementation(callback =>
        callback({ data: null, error: mockError })
      );

      const result = await databaseClient.query('SELECT * FROM nonexistent_table');

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(DatabaseErrorType.QUERY_ERROR);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('select', () => {
    it('should select data from a table successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'Test' }],
        error: null,
        count: 1,
      };
      mockSupabaseQuery.then.mockImplementation(callback => callback(mockResponse));

      const result = await databaseClient.select('test_table');

      expect(result.data).toEqual([{ id: 1, name: 'Test' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
      expect(result.metadata.operation).toBe(QueryOperation.SELECT);
    });

    it('should handle selection errors', async () => {
      // Mock error response
      const mockError = {
        message: 'Permission denied',
        code: '42501',
      };
      mockSupabaseQuery.then.mockImplementation(callback =>
        callback({ data: null, error: mockError })
      );

      const result = await databaseClient.select('restricted_table');

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(DatabaseErrorType.PERMISSION_ERROR);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('insert', () => {
    it('should insert data into a table successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'New Record' }],
        error: null,
        count: 1,
      };
      mockSupabaseQuery.then.mockImplementation(callback => callback(mockResponse));

      const result = await databaseClient.insert('test_table', { name: 'New Record' });

      expect(result.data).toEqual([{ id: 1, name: 'New Record' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
      expect(result.metadata.operation).toBe(QueryOperation.INSERT);
    });

    it('should handle insertion errors', async () => {
      // Mock error response
      const mockError = {
        message: 'Duplicate key value violates unique constraint',
        code: '23505',
      };
      mockSupabaseQuery.then.mockImplementation(callback =>
        callback({ data: null, error: mockError })
      );

      const result = await databaseClient.insert('test_table', { id: 1, name: 'Duplicate' });

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(DatabaseErrorType.CONSTRAINT_ERROR);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update data in a table successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'Updated Record' }],
        error: null,
        count: 1,
      };
      mockSupabaseQuery.then.mockImplementation(callback => callback(mockResponse));

      const result = await databaseClient.update(
        'test_table',
        { name: 'Updated Record' },
        { id: 1 }
      );

      expect(result.data).toEqual([{ id: 1, name: 'Updated Record' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
      expect(result.metadata.operation).toBe(QueryOperation.UPDATE);
    });

    it('should handle update errors', async () => {
      // Mock error response
      const mockError = {
        message: 'Foreign key constraint violation',
        code: '23503',
      };
      mockSupabaseQuery.then.mockImplementation(callback =>
        callback({ data: null, error: mockError })
      );

      const result = await databaseClient.update('test_table', { foreign_id: 999 }, { id: 1 });

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(DatabaseErrorType.CONSTRAINT_ERROR);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete data from a table successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'Deleted Record' }],
        error: null,
        count: 1,
      };
      mockSupabaseQuery.then.mockImplementation(callback => callback(mockResponse));

      const result = await databaseClient.delete('test_table', { id: 1 });

      expect(result.data).toEqual([{ id: 1, name: 'Deleted Record' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
      expect(result.metadata.operation).toBe(QueryOperation.DELETE);
    });

    it('should handle deletion errors', async () => {
      // Mock error response
      const mockError = {
        message: 'Permission denied',
        code: '42501',
      };
      mockSupabaseQuery.then.mockImplementation(callback =>
        callback({ data: null, error: mockError })
      );

      const result = await databaseClient.delete('restricted_table', { id: 1 });

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(DatabaseErrorType.PERMISSION_ERROR);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get a record by ID successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: { id: 1, name: 'Test Record' },
        error: null,
      };
      mockSupabaseQuery.then.mockImplementation(callback => callback(mockResponse));

      const result = await databaseClient.getById('test_table', 1);

      expect(result.data).toEqual({ id: 1, name: 'Test Record' });
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
      expect(result.metadata.operation).toBe(QueryOperation.SELECT);
    });

    it('should handle not found errors gracefully', async () => {
      // Mock not found response
      const mockError = {
        message: 'Not found',
        code: 'PGRST116',
      };
      mockSupabaseQuery.then.mockImplementation(callback =>
        callback({ data: null, error: mockError })
      );

      const result = await databaseClient.getById('test_table', 999);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull(); // Not found is not treated as an error
      expect(result.metadata.operation).toBe(QueryOperation.SELECT);
      expect(toast.error).not.toHaveBeenCalled(); // No error toast for not found
    });
  });

  describe('error handling', () => {
    it('should categorize errors by their code', async () => {
      // Test different error codes
      const errorCodes = {
        '23505': DatabaseErrorType.CONSTRAINT_ERROR,
        '42501': DatabaseErrorType.PERMISSION_ERROR,
        PGRST116: DatabaseErrorType.NOT_FOUND_ERROR,
        '28000': DatabaseErrorType.AUTHENTICATION_ERROR,
        '57014': DatabaseErrorType.TIMEOUT_ERROR,
        '42P01': DatabaseErrorType.PERMISSION_ERROR,
      };

      for (const [code, expectedType] of Object.entries(errorCodes)) {
        // Mock error response
        const mockError = {
          message: `Error with code ${code}`,
          code,
        };
        mockSupabaseRpc.then.mockImplementation(callback =>
          callback({ data: null, error: mockError })
        );

        const result = await databaseClient.query('SELECT * FROM test');

        expect(result.error?.type).toBe(expectedType);

        if (code !== 'PGRST116') {
          // Not found errors don't show toasts
          expect(toast.error).toHaveBeenCalled();
        }

        vi.clearAllMocks();
      }
    });
  });
});
