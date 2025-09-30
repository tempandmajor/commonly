/**
 * Unit Tests for Table Operations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTableOperations } from '../api/tableOperations';
import { databaseClient } from '../api/databaseClient';
import { QueryOperation } from '../core/types';

// Mock databaseClient
vi.mock('../api/databaseClient', () => ({
  databaseClient: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    getSupabaseClient: vi.fn(() => ({})),
  },
}));

describe('TableOperations', () => {
  const tableName = 'test_table';
  let tableOps: ReturnType<typeof createTableOperations>;

  beforeEach(() => {
    tableOps = createTableOperations(tableName);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findAll', () => {
    it('should call databaseClient.select with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'Test' }],
        error: null,
        metadata: {
          rowCount: 1,
          operation: QueryOperation.SELECT,
        },
      };
      (databaseClient.select as any).mockResolvedValue(mockResponse);

      // Define query options
      const options = {
        filters: { status: 'active' },
        order: [{ column: 'created_at', ascending: false }],
        pagination: { page: 1, pageSize: 10 },
      };

      const result = await tableOps.findAll(options);

      // Verify select was called with correct parameters
      expect(databaseClient.select).toHaveBeenCalledWith(tableName, {
        filters: options.filters,
        order: options.order,
        pagination: options.pagination,
        });

      expect(result.data).toEqual([{ id: 1, name: 'Test' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
    });

    it('should handle errors properly', async () => {
      // Mock error response
      const mockResponse = {
        data: [],
        error: { message: 'Database error', type: 'ERROR' },
        metadata: {
          rowCount: 0,
          operation: QueryOperation.SELECT,
        },
      };
      (databaseClient.select as any).mockResolvedValue(mockResponse);

      const result = await tableOps.findAll();

      expect(result.data).toEqual([]);
      expect(result.error).toEqual({ message: 'Database error', type: 'ERROR' });
    });
  });

  describe('findById', () => {
    it('should call databaseClient.getById with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        error: null,
        metadata: {
          rowCount: 1,
          operation: QueryOperation.SELECT,
        },
      };
      (databaseClient.getById as any).mockResolvedValue(mockResponse);

      const id = 1;
      const options = { columns: ['id', 'name'] };

      const result = await tableOps.findById(id, options);

      // Verify getById was called with correct parameters
      expect(databaseClient.getById).toHaveBeenCalledWith(tableName, id, {
        columns: options.columns,
        });

      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.error).toBeNull();
    });

    it('should return null when record not found', async () => {
      // Mock not found response
      const mockResponse = {
        data: null,
        error: null,
        metadata: {
          rowCount: 0,
          operation: QueryOperation.SELECT,
        },
      };
      (databaseClient.getById as any).mockResolvedValue(mockResponse);

      const result = await tableOps.findById(999);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('findByField', () => {
    it('should call databaseClient.select with field filter', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'Test', status: 'active' }],
        error: null,
        metadata: {
          rowCount: 1,
          operation: QueryOperation.SELECT,
        },
      };
      (databaseClient.select as any).mockResolvedValue(mockResponse);

      const field = 'status';
      const value = 'active';
      const options = { columns: ['id', 'name', 'status'] };

      const result = await tableOps.findByField(field, value, options);

      // Verify select was called with correct filter
      expect(databaseClient.select).toHaveBeenCalledWith(tableName, {
        filters: { [field]: value },
        columns: options.columns,
        });

      expect(result.data).toEqual([{ id: 1, name: 'Test', status: 'active' }]);
      expect(result.error).toBeNull();
    });

    it('should return empty array when no matching records', async () => {
      // Mock empty response
      const mockResponse = {
        data: [],
        error: null,
        metadata: {
          rowCount: 0,
          operation: QueryOperation.SELECT,
        },
      };
      (databaseClient.select as any).mockResolvedValue(mockResponse);

      const result = await tableOps.findByField('status', 'inactive');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('insert', () => {
    it('should call databaseClient.insert with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 1, name: 'New Record' }],
        error: null,
        metadata: {
          rowCount: 1,
          operation: QueryOperation.INSERT,
        },
      };
      (databaseClient.insert as any).mockResolvedValue(mockResponse);

      const data = { name: 'New Record' };
      const options = { returning: 'id,name' };

      const result = await tableOps.insert(data, options);

      // Verify insert was called with correct parameters
      expect(databaseClient.insert).toHaveBeenCalledWith(tableName, data, {
        returning: options.returning,
        });

      expect(result.data).toEqual([{ id: 1, name: 'New Record' }]);
      expect(result.error).toBeNull();
      expect(result.metadata.rowCount).toBe(1);
    });

    it('should handle insertion errors', async () => {
      // Mock error response
      const mockResponse = {
        data: [],
        error: { message: 'Constraint violation', type: 'ERROR' },
        metadata: {
          rowCount: 0,
          operation: QueryOperation.INSERT,
        },
      };
      (databaseClient.insert as any).mockResolvedValue(mockResponse);

      const result = await tableOps.insert({ invalid: 'data' });

      expect(result.data).toEqual([]);
      expect(result.error).toEqual({ message: 'Constraint violation', type: 'ERROR' });
    });
  });

  describe('update', () => {
    it('should call databaseClient.update with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        data: { id: 1, name: 'Updated Record' },
        error: null,
        metadata: {
          rowCount: 1,
          operation: QueryOperation.UPDATE,
        },
      };
      (databaseClient.update as any).mockResolvedValue(mockResponse);

      const id = 1;
      const data = { name: 'Updated Record' };
      const options = { returning: 'id,name' };

      const result = await tableOps.update(id, data, options);

      // Verify update was called with correct parameters
      expect(databaseClient.update).toHaveBeenCalledWith(
        tableName,
        data,
        { id },
        {
          returning: options.returning,
          }
      );

      expect(result.data).toEqual({ id: 1, name: 'Updated Record' });
      expect(result.error).toBeNull();
    });

    it('should handle update errors', async () => {
      // Mock error response
      const mockResponse = {
        data: null,
        error: { message: 'Record not found', type: 'ERROR' },
        metadata: {
          rowCount: 0,
          operation: QueryOperation.UPDATE,
        },
      };
      (databaseClient.update as any).mockResolvedValue(mockResponse);

      const result = await tableOps.update(999, { name: 'Not Found' });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'Record not found', type: 'ERROR' });
    });
  });

  describe('delete', () => {
    it('should call databaseClient.delete with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        data: { id: 1, name: 'Deleted Record' },
        error: null,
        metadata: {
          rowCount: 1,
          operation: QueryOperation.DELETE,
        },
      };
      (databaseClient.delete as any).mockResolvedValue(mockResponse);

      const id = 1;
      const options = { returning: 'id,name' };

      const result = await tableOps.delete(id, options);

      // Verify delete was called with correct parameters
      expect(databaseClient.delete).toHaveBeenCalledWith(
        tableName,
        { id },
        {
          returning: options.returning,
          }
      );

      expect(result.data).toEqual({ id: 1, name: 'Deleted Record' });
      expect(result.error).toBeNull();
    });

    it('should handle delete errors', async () => {
      // Mock error response
      const mockResponse = {
        data: null,
        error: { message: 'Foreign key constraint violation', type: 'ERROR' },
        metadata: {
          rowCount: 0,
          operation: QueryOperation.DELETE,
        },
      };
      (databaseClient.delete as any).mockResolvedValue(mockResponse);

      const result = await tableOps.delete(1);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'Foreign key constraint violation', type: 'ERROR' });
    });
  });
});
