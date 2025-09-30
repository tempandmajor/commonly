/**
 * Unit Tests for Database Utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { databaseUtils } from '../utils/databaseUtils';
import { databaseClient } from '../api/databaseClient';
import { transactionManager } from '../api/transactionManager';

// Mock dependencies
vi.mock('../api/databaseClient', () => ({
  databaseClient: {
    query: vi.fn(),
    getSupabaseClient: vi.fn(() => ({})),
  },
}));

vi.mock('../api/transactionManager', () => ({
  transactionManager: {
    begin: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    query: vi.fn(),
  },
}));

describe('Database Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Cache functions', () => {
    it('should generate consistent cache keys', () => {
      const key1 = databaseUtils.generateCacheKey('select', 'users', { id: 1 });
      const key2 = databaseUtils.generateCacheKey('select', 'users', { id: 1 });
      const key3 = databaseUtils.generateCacheKey('select', 'users', { id: 2 });

      expect(key1).toEqual(key2);
      expect(key1).not.toEqual(key3);
    });

    it('should store and retrieve cached results', () => {
      const key = 'test-cache-key';
      const testData = { name: 'Test Data' };

      // Initially should not have data
      expect(databaseUtils.getCachedResult(key)).toBeNull();

      // Store data
      databaseUtils.cacheResult(key, testData, 1000);

      // Should retrieve data
      expect(databaseUtils.getCachedResult(key)).toEqual(testData);
    });

    it('should expire cached results based on TTL', async () => {
      const key = 'expiring-cache-key';
      const testData = { name: 'Expiring Data' };

      // Store data with 10ms TTL
      databaseUtils.cacheResult(key, testData, 10);

      // Should be available immediately
      expect(databaseUtils.getCachedResult(key)).toEqual(testData);

      // Wait for expiration
      await new Promise(r => setTimeout(r, 20));

      // Should be expired
      expect(databaseUtils.getCachedResult(key)).toBeNull();
    });

    it('should clear cache entries', () => {
      // Setup multiple cache entries
      databaseUtils.cacheResult('key1', 'value1');
      databaseUtils.cacheResult('key2', 'value2');
      databaseUtils.cacheResult('test-key3', 'value3');

      // Clear specific pattern
      databaseUtils.clearCache('test-');

      // Check results
      expect(databaseUtils.getCachedResult('key1')).toBe('value1');
      expect(databaseUtils.getCachedResult('key2')).toBe('value2');
      expect(databaseUtils.getCachedResult('test-key3')).toBeNull();

      // Clear all
      databaseUtils.clearCache();

      // All should be cleared
      expect(databaseUtils.getCachedResult('key1')).toBeNull();
      expect(databaseUtils.getCachedResult('key2')).toBeNull();
    });

    it('should execute cached queries', async () => {
      const query = 'SELECT * FROM test';
      const params = [1, 2];
      const mockResult = {
        data: [{ id: 1, name: 'Test' }],
        error: null,
        metadata: { rowCount: 1 },
      };

      // Mock database client
      (databaseClient.query as any).mockResolvedValue(mockResult);

      // First call should execute query
      const result1 = await databaseUtils.cachedQuery(query, params);
      expect(databaseClient.query).toHaveBeenCalledWith(query, params);
      expect(result1).toEqual(mockResult);

      // Clear mock to verify second call doesn't hit database
      vi.clearAllMocks();

      // Second call should use cache
      const result2 = await databaseUtils.cachedQuery(query, params);
      expect(databaseClient.query).not.toHaveBeenCalled();
      expect(result2).toEqual(mockResult);

      // Bypass cache should execute query again
      const result3 = await databaseUtils.cachedQuery(query, params, { bypassCache: true });
      expect(databaseClient.query).toHaveBeenCalledWith(query, params);
      expect(result3).toEqual(mockResult);
    });
  });

  describe('Database schema utilities', () => {
    it('should check if table exists', async () => {
      // Mock response for existing table
      (databaseClient.query as any).mockResolvedValueOnce({
        data: [{ exists: true }],
        error: null,
      });

      const exists = await databaseUtils.tableExists('users');
      expect(exists).toBe(true);
      expect(databaseClient.query).toHaveBeenCalledWith(expect.stringContaining('pg_tables'), [
        'public',
        'users',
      ]);

      // Mock response for non-existing table
      (databaseClient.query as any).mockResolvedValueOnce({
        data: [{ exists: false }],
        error: null,
      });

      const notExists = await databaseUtils.tableExists('nonexistent');
      expect(notExists).toBe(false);
    });

    it('should get record count', async () => {
      // Mock response
      (databaseClient.query as any).mockResolvedValue({
        data: [{ count: 42 }],
        error: null,
      });

      // Without filters
      const count = await databaseUtils.getRecordCount('users');
      expect(count).toBe(42);
      expect(databaseClient.query).toHaveBeenLastCalledWith(
        'SELECT COUNT(*) FROM public.users',
        []
      );

      // With filters
      const countWithFilters = await databaseUtils.getRecordCount('users', { active: true });
      expect(countWithFilters).toBe(42);
      expect(databaseClient.query).toHaveBeenLastCalledWith(
        'SELECT COUNT(*) FROM public.users WHERE active = $1',
        [true]
      );
    });

    it('should check if record exists by field value', async () => {
      // Mock response for existing record
      (databaseClient.query as any).mockResolvedValueOnce({
        data: [{ exists: true }],
        error: null,
      });

      const exists = await databaseUtils.recordExists('users', 'email', 'test@example.com');
      expect(exists).toBe(true);
      expect(databaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        ['test@example.com']
      );

      // Mock response for non-existing record
      (databaseClient.query as any).mockResolvedValueOnce({
        data: [{ exists: false }],
        error: null,
      });

      const notExists = await databaseUtils.recordExists(
        'users',
        'email',
        'nonexistent@example.com'
      );
      expect(notExists).toBe(false);
    });
  });

  describe('Transaction utilities', () => {
    it('should execute operations in a transaction', async () => {
      // Setup mocks
      (transactionManager.query as any).mockResolvedValue([{ id: 1 }]);

      // Execute transaction
      const result = await databaseUtils.withTransaction(async tx => {
        const res = await tx.query('INSERT INTO test VALUES ($1)', [1]);
        return res;
      });

      // Verify transaction flow
      expect(transactionManager.begin).toHaveBeenCalled();
      expect(transactionManager.query).toHaveBeenCalledWith('INSERT INTO test VALUES ($1)', [1]);
      expect(transactionManager.commit).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should rollback on error', async () => {
      // Setup error case
      (transactionManager.query as any).mockRejectedValue(new Error('Test error'));

      // Execute transaction that should fail
      await expect(
        databaseUtils.withTransaction(async tx => {
          return await tx.query('INSERT INTO test VALUES ($1)', [1]);
        })
      ).rejects.toThrow();

      // Verify rollback
      expect(transactionManager.begin).toHaveBeenCalled();
      expect(transactionManager.rollback).toHaveBeenCalled();
      expect(transactionManager.commit).not.toHaveBeenCalled();
    });
  });

  describe('SQL formatting utilities', () => {
    it('should format SQL values safely', () => {
      // Test various data types
      expect(databaseUtils.formatSqlValue(null)).toBe('NULL');
      expect(databaseUtils.formatSqlValue(undefined)).toBe('NULL');
      expect(databaseUtils.formatSqlValue(42)).toBe('42');
      expect(databaseUtils.formatSqlValue(true)).toBe('TRUE');
      expect(databaseUtils.formatSqlValue(false)).toBe('FALSE');

      // String escaping
      expect(databaseUtils.formatSqlValue("O'Reilly")).toBe("'O''Reilly'");

      // Date
      const date = new Date('2023-01-01');
      expect(databaseUtils.formatSqlValue(date)).toContain('2023-01-01');

      // Arrays
      expect(databaseUtils.formatSqlValue([1, 2, 3])).toBe('ARRAY[1, 2, 3]');

      // Objects
      expect(databaseUtils.formatSqlValue({ a: 1 })).toBe('\'{"a":1}\'::jsonb');
    });

    it('should format WHERE clauses from filter objects', () => {
      // Simple filter
      const simple = databaseUtils.formatWhereClause({ id: 1, active: true });
      expect(simple.whereClause).toBe('WHERE id = $1 AND active = $2');
      expect(simple.params).toEqual([1, true]);

      // With null values
      const withNull = databaseUtils.formatWhereClause({ id: 1, parent_id: null });
      expect(withNull.whereClause).toBe('WHERE id = $1 AND parent_id IS NULL');
      expect(withNull.params).toEqual([1]);

      // With custom param index
      const customIndex = databaseUtils.formatWhereClause({ id: 1 }, 5);
      expect(customIndex.whereClause).toBe('WHERE id = $5');
      expect(customIndex.params).toEqual([1]);
      expect(customIndex.nextParamIndex).toBe(6);

      // Empty filters
      const empty = databaseUtils.formatWhereClause({});
      expect(empty.whereClause).toBe('');
      expect(empty.params).toEqual([]);
    });
  });
});
