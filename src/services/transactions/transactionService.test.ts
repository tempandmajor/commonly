/**
 * Transaction Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRecentTransactions, getTransactionsByDateRange } from './transactionService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(),
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock Sentry
vi.mock('@/config/sentry', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('Transaction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecentTransactions', () => {
    it('should return transactions for valid user ID', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 10000,
          description: 'Test Event',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getRecentTransactions(
        '123e4567-e89b-12d3-a456-426614174000',
        5
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '123e4567-e89b-12d3-a456-426614174001',
        event: 'Test Event',
        amount: 100, // Converted from cents
        status: 'completed',
      });
    });

    it('should return empty array for invalid user ID', async () => {
      const result = await getRecentTransactions('invalid-uuid');

      expect(result).toEqual([]);
    });

    it('should validate limit parameter', async () => {
      const result = await getRecentTransactions(
        '123e4567-e89b-12d3-a456-426614174000',
        -1 // Invalid limit
      );

      expect(result).toEqual([]);
    });

    it('should reject limit above maximum', async () => {
      const result = await getRecentTransactions(
        '123e4567-e89b-12d3-a456-426614174000',
        101 // Above max of 100
      );

      expect(result).toEqual([]);
    });

    it('should retry on failure with exponential backoff', async () => {
      let callCount = 0;

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount < 2) {
                  return Promise.resolve({
                    data: null,
                    error: { message: 'Temporary error' },
                  });
                }
                return Promise.resolve({
                  data: [],
                  error: null,
                });
              }),
            }),
          }),
        }),
      } as any);

      const result = await getRecentTransactions(
        '123e4567-e89b-12d3-a456-426614174000'
      );

      expect(callCount).toBeGreaterThan(1); // Should have retried
      expect(result).toEqual([]);
    });

    it('should filter out invalid transaction records', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 10000,
          description: 'Valid transaction',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'invalid-id', // Invalid UUID
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 5000,
          description: 'Invalid transaction',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getRecentTransactions(
        '123e4567-e89b-12d3-a456-426614174000'
      );

      // Only valid transaction should be returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should convert cents to dollars correctly', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 12345, // $123.45
          description: 'Test',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getRecentTransactions(
        '123e4567-e89b-12d3-a456-426614174000'
      );

      expect(result[0].amount).toBe(123.45);
    });
  });

  describe('getTransactionsByDateRange', () => {
    it('should return transactions for valid date range', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 10000,
          description: 'Test Event',
          status: 'completed',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await getTransactionsByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        startDate,
        endDate
      );

      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('Test Event');
    });

    it('should return empty array for invalid user ID', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await getTransactionsByDateRange(
        'invalid-uuid',
        startDate,
        endDate
      );

      expect(result).toEqual([]);
    });

    it('should reject invalid start date', async () => {
      const endDate = new Date('2025-01-31');

      const result = await getTransactionsByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        'invalid' as any,
        endDate
      );

      expect(result).toEqual([]);
    });

    it('should reject invalid end date', async () => {
      const startDate = new Date('2025-01-01');

      const result = await getTransactionsByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        startDate,
        'invalid' as any
      );

      expect(result).toEqual([]);
    });

    it('should reject when start date is after end date', async () => {
      const startDate = new Date('2025-01-31');
      const endDate = new Date('2025-01-01');

      const result = await getTransactionsByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        startDate,
        endDate
      );

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      } as any);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await getTransactionsByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        startDate,
        endDate
      );

      expect(result).toEqual([]);
    });

    it('should filter out invalid transaction records', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 10000,
          description: 'Valid',
          status: 'completed',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: 'invalid-uuid',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 5000,
          description: 'Invalid',
          status: 'completed',
          created_at: '2025-01-16T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await getTransactionsByDateRange(
        '123e4567-e89b-12d3-a456-426614174000',
        startDate,
        endDate
      );

      // Only valid transaction should be returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });
});