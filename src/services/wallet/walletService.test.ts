/**
 * Wallet Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWalletBalance, getWalletTransactions } from './walletService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(),
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

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Wallet Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance for valid user ID', async () => {
      const mockWallet = {
        available_balance_in_cents: 10000,
        pending_balance_in_cents: 2000,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockWallet,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getWalletBalance('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        available: 10000,
        pending: 2000,
      });
    });

    it('should return zero balance if wallet does not exist', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getWalletBalance('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        available: 0,
        pending: 0,
      });
    });

    it('should return zero balance and show error for invalid user ID', async () => {
      const result = await getWalletBalance('invalid-uuid');

      expect(result).toEqual({
        available: 0,
        pending: 0,
      });
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const result = await getWalletBalance('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        available: 0,
        pending: 0,
      });
    });

    it('should validate and parse wallet data', async () => {
      const mockWallet = {
        available_balance_in_cents: 5000,
        pending_balance_in_cents: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockWallet,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getWalletBalance('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        available: 5000,
        pending: 0, // null should be converted to 0
      });
    });
  });

  describe('getWalletTransactions', () => {
    it('should return transactions for valid user ID', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 10000,
          type: 'credit',
          status: 'completed',
          description: 'Test transaction',
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

      const result = await getWalletTransactions(
        '123e4567-e89b-12d3-a456-426614174000',
        10
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTransactions[0]);
    });

    it('should return empty array for invalid user ID', async () => {
      const result = await getWalletTransactions('invalid-uuid');

      expect(result).toEqual([]);
    });

    it('should validate limit parameter', async () => {
      const result = await getWalletTransactions(
        '123e4567-e89b-12d3-a456-426614174000',
        -1 // Invalid limit
      );

      expect(result).toEqual([]);
    });

    it('should reject limit above maximum', async () => {
      const result = await getWalletTransactions(
        '123e4567-e89b-12d3-a456-426614174000',
        101 // Above max of 100
      );

      expect(result).toEqual([]);
    });

    it('should filter out invalid transaction records', async () => {
      const mockTransactions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 10000,
          type: 'credit',
          status: 'completed',
          description: 'Valid transaction',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'invalid-id', // Invalid UUID
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          amount_in_cents: 5000,
          type: 'credit',
          status: 'completed',
          description: 'Invalid transaction',
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

      const result = await getWalletTransactions(
        '123e4567-e89b-12d3-a456-426614174000'
      );

      // Only valid transaction should be returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any);

      const result = await getWalletTransactions(
        '123e4567-e89b-12d3-a456-426614174000'
      );

      expect(result).toEqual([]);
    });
  });
});