/**
 * @file Tests for Payment Service hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';

// Import hooks
import {
  useWallet,
  useCredit,
  useAddCredit,
  useDeductCredit,
  usePaymentMethods,
  useAttachPaymentMethod,
  useDetachPaymentMethod,
  useUpdateDefaultPaymentMethod,
  useCreateCheckoutSession,
  useGetTransactions,
} from '../hooks/usePayment';

// Mock APIs
vi.mock('../api', () => ({
  walletAPI: {
    getWallet: vi.fn(),
    updateWallet: vi.fn(),
  },
  creditAPI: {
    getBalance: vi.fn(),
    addCredit: vi.fn(),
    deductCredit: vi.fn(),
    useCredit: vi.fn(),
  },
  paymentMethodsAPI: {
    getPaymentMethods: vi.fn(),
    attachPaymentMethod: vi.fn(),
    detachPaymentMethod: vi.fn(),
    updateDefaultPaymentMethod: vi.fn(),
  },
  stripeAPI: {
    createCheckoutSession: vi.fn(),
  },
  transactionsAPI: {
    getTransactionHistory: vi.fn(),
  },
}));

// Import mocked APIs
import { walletAPI, creditAPI, paymentMethodsAPI, stripeAPI, transactionsAPI } from '../api';

// Test wrapper with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Payment Service Hooks', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useWallet', () => {
    it('should fetch wallet data successfully', async () => {
      const mockWallet = {
        id: '123',
        userId: testUserId,
        balance: 100,
        availableBalance: 100,
        pendingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (walletAPI.getWallet as any).mockResolvedValue(mockWallet);

      const { result, waitFor } = renderHook(() => useWallet(testUserId), {
        wrapper: createWrapper(),
      });

      // Initial state should be loading
      expect(result.current.isLoading).toBe(true);

      // Wait for the query to complete
      await waitFor(() => !result.current.isLoading);

      // Check if API was called correctly
      expect(walletAPI.getWallet).toHaveBeenCalledWith(testUserId);

      // Check if data is returned correctly
      expect(result.current.wallet).toEqual(mockWallet);
      expect(result.current.error).toBeNull();
    });

    it('should handle error when fetching wallet', async () => {
      const errorMessage = 'Failed to fetch wallet';
      (walletAPI.getWallet as any).mockRejectedValue(new Error(errorMessage));

      const { result, waitFor } = renderHook(() => useWallet(testUserId), {
        wrapper: createWrapper(),
      });

      // Wait for the query to complete
      await waitFor(() => !result.current.isLoading);

      // Check if error is handled correctly
      expect(result.current.error).not.toBeNull();
      expect(result.current.wallet).toBeUndefined();
    });
  });

  describe('useCredit', () => {
    it('should fetch credit balance successfully', async () => {
      (creditAPI.getBalance as any).mockResolvedValue(150);

      const { result, waitFor } = renderHook(() => useCredit(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => !result.current.isLoading);

      expect(creditAPI.getBalance).toHaveBeenCalledWith(testUserId);
      expect(result.current.balance).toBe(150);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useAddCredit', () => {
    it('should add credit successfully', async () => {
      (creditAPI.addCredit as any).mockResolvedValue(true);

      const { result } = renderHook(() => useAddCredit(), { wrapper: createWrapper() });

      await act(async () => {
        const response = await result.current.mutateAsync({
          userId: testUserId,
          amount: 50,
          description: 'Test credit addition',
        });
        expect(response).toBe(true);
      });

      expect(creditAPI.addCredit).toHaveBeenCalledWith({
        userId: testUserId,
        amount: 50,
        description: 'Test credit addition',
      });
    });

    it('should handle error when adding credit fails', async () => {
      const errorMessage = 'Failed to add credit';
      (creditAPI.addCredit as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAddCredit(), { wrapper: createWrapper() });

      let caughtError;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            userId: testUserId,
            amount: 50,
          });
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBeDefined();
    });
  });

  describe('useDeductCredit', () => {
    it('should deduct credit successfully', async () => {
      (creditAPI.deductCredit as any).mockResolvedValue(true);

      const { result } = renderHook(() => useDeductCredit(), { wrapper: createWrapper() });

      await act(async () => {
        const response = await result.current.mutateAsync({
          userId: testUserId,
          amount: 25,
          description: 'Test deduction',
        });
        expect(response).toBe(true);
      });

      expect(creditAPI.deductCredit).toHaveBeenCalledWith({
        userId: testUserId,
        amount: 25,
        description: 'Test deduction',
      });
    });
  });

  describe('usePaymentMethods', () => {
    it('should fetch payment methods successfully', async () => {
      const mockPaymentMethods = [
        {
          id: 'pm_123',
          userId: testUserId,
          type: 'card',
          isDefault: true,
          lastFour: '4242',
          brand: 'visa',
        },
      ];

      (paymentMethodsAPI.getPaymentMethods as any).mockResolvedValue(mockPaymentMethods);

      const { result, waitFor } = renderHook(() => usePaymentMethods(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => !result.current.isLoading);

      expect(paymentMethodsAPI.getPaymentMethods).toHaveBeenCalledWith(testUserId);
      expect(result.current.paymentMethods).toEqual(mockPaymentMethods);
    });
  });

  describe('useAttachPaymentMethod', () => {
    it('should attach payment method successfully', async () => {
      (paymentMethodsAPI.attachPaymentMethod as any).mockResolvedValue(true);

      const { result } = renderHook(() => useAttachPaymentMethod(), { wrapper: createWrapper() });

      await act(async () => {
        const response = await result.current.mutateAsync({
          userId: testUserId,
          paymentMethodId: 'pm_123',
        });
        expect(response).toBe(true);
      });

      expect(paymentMethodsAPI.attachPaymentMethod).toHaveBeenCalledWith(testUserId, 'pm_123');
    });
  });

  describe('useDetachPaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      (paymentMethodsAPI.detachPaymentMethod as any).mockResolvedValue(true);

      const { result } = renderHook(() => useDetachPaymentMethod(), { wrapper: createWrapper() });

      await act(async () => {
        const response = await result.current.mutateAsync({
          userId: testUserId,
          paymentMethodId: 'pm_123',
        });
        expect(response).toBe(true);
      });

      expect(paymentMethodsAPI.detachPaymentMethod).toHaveBeenCalledWith(testUserId, 'pm_123');
    });
  });

  describe('useUpdateDefaultPaymentMethod', () => {
    it('should update default payment method successfully', async () => {
      (paymentMethodsAPI.updateDefaultPaymentMethod as any).mockResolvedValue(true);

      const { result } = renderHook(() => useUpdateDefaultPaymentMethod(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.mutateAsync({
          userId: testUserId,
          paymentMethodId: 'pm_123',
        });
        expect(response).toBe(true);
      });

      expect(paymentMethodsAPI.updateDefaultPaymentMethod).toHaveBeenCalledWith(
        testUserId,
        'pm_123'
      );
    });
  });

  describe('useCreateCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockCheckoutSession = {
        checkoutUrl: 'https://checkout.stripe.com/123',
        sessionId: 'cs_123',
      };

      (stripeAPI.createCheckoutSession as any).mockResolvedValue(mockCheckoutSession);

      const { result } = renderHook(() => useCreateCheckoutSession(), { wrapper: createWrapper() });

      const sessionOptions = {
        userId: testUserId,
        amount: 100,
        description: 'Test checkout',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      await act(async () => {
        const response = await result.current.mutateAsync(sessionOptions);
        expect(response).toEqual(mockCheckoutSession);
      });

      expect(stripeAPI.createCheckoutSession).toHaveBeenCalledWith(sessionOptions);
    });
  });

  describe('useGetTransactions', () => {
    it('should fetch transaction history successfully', async () => {
      const mockTransactions = [
        {
          id: 'tx_123',
          userId: testUserId,
          amount: 50,
          description: 'Test transaction',
          type: 'credit_addition',
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      (transactionsAPI.getTransactionHistory as any).mockResolvedValue(mockTransactions);

      const { result, waitFor } = renderHook(() => useGetTransactions(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => !result.current.isLoading);

      expect(transactionsAPI.getTransactionHistory).toHaveBeenCalledWith(testUserId);
      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });
});
