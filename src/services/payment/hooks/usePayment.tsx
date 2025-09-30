/**
 * Payment Service - React Hooks
 *
 * React hooks for interacting with the payment service.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/services/auth';
import {
  walletAPI,
  transactionsAPI,
  creditAPI,
  stripeAPI,
  PaymentMethod,
  PaymentMethodType,
  Transaction,
  TransactionType,
  CheckoutSessionOptions,
} from '..';

// Define return type for stripe checkout session
interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

// Query keys for React Query
const QUERY_KEYS = {
  WALLET: 'wallet',
  PAYMENT_METHODS: 'payment-methods',
  TRANSACTIONS: 'transactions',
};

interface UsePaymentOptions {
  initialFetch?: boolean | undefined;
}

/**
 * Main payment hook for accessing wallet, transactions, and payment methods
 */
export const usePayment = (options: UsePaymentOptions = { initialFetch: true }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Wallet data
  const {
    data: wallet,
    isLoading: isWalletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: [QUERY_KEYS.WALLET, userId],
    queryFn: () => (userId ? walletAPI.getWallet(userId) : null),
    enabled: !!userId && options.initialFetch === true,
  });

  // Payment methods
  const {
    data: paymentMethods,
    isLoading: isPaymentMethodsLoading,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods,
  } = useQuery({
    queryKey: [QUERY_KEYS.PAYMENT_METHODS, userId],
    queryFn: () => (userId ? walletAPI.getPaymentMethods(userId) : []),
    enabled: !!userId && options.initialFetch === true,
  });

  // Add payment method mutation
  const { mutate: addPaymentMethod, isPending: isAddingPaymentMethod } = useMutation({
    mutationFn: (data: { paymentMethodId: string }) => {
      if (!userId) throw new Error('User not authenticated');
      return walletAPI.attachPaymentMethod(userId, data.paymentMethodId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_METHODS] });
    },
  });

  // Remove payment method mutation
  const { mutate: removePaymentMethod, isPending: isRemovingPaymentMethod } = useMutation({
    mutationFn: (paymentMethodId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return walletAPI.detachPaymentMethod(userId, paymentMethodId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_METHODS] });
    },
  });

  // Set default payment method mutation
  const { mutate: setDefaultPaymentMethod, isPending: isSettingDefaultPaymentMethod } = useMutation(
    {
      mutationFn: (paymentMethodId: string) => {
        if (!userId) throw new Error('User not authenticated');
        return walletAPI.updateDefaultPaymentMethod(userId, paymentMethodId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENT_METHODS] });
      },
    }
  );

  // Recent transactions
  const {
    data: recentTransactions,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, userId],
    queryFn: () => (userId ? transactionsAPI.getTransactions(userId, { limit: 10 }) : []),
    enabled: !!userId && options.initialFetch === true,
  });

  // Add credits to wallet mutation
  const { mutate: addCredits, isPending: isAddingCredits } = useMutation({
    mutationFn: (data: { amount: number; description?: string }) => {
      if (!userId) throw new Error('User not authenticated');
      return creditAPI.addCredit({
        userId,
        amount: data.amount,
        description: data.description || 'Credit addition',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WALLET] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
    },
  });

  // Use credits mutation
  const { mutate: useCredits, isPending: isUsingCredits } = useMutation({
    mutationFn: (data: { amount: number; description?: string; referenceId?: string }) => {
      if (!userId) throw new Error('User not authenticated');
      return creditAPI.useCredit({
        userId,
        amount: data.amount,
        description: data.description || 'Credit deduction',
        referenceId: data.referenceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WALLET] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
    },
  });

  // Create checkout session
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const createCheckoutSession = useCallback(
    async (options: Omit<CheckoutSessionOptions, 'userId'>) => {
      if (!userId) throw new Error('User not authenticated');

      setIsCreatingCheckout(true);
      try {
        const result: CheckoutSessionResult = (await stripeAPI.createCheckoutSession({
          ...options,
          userId,
        })) as CheckoutSessionResult;

        setCheckoutUrl(result.checkoutUrl);
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsCreatingCheckout(false);
      }
    },
    [userId]
  );

  // Check if user has sufficient credits
  const hasSufficientCredits = useCallback(
    (amount: number) => {
      if (!wallet) return false;
      return wallet.availableBalance >= amount;
    },
    [wallet]
  );

  // Clear checkout URL when component unmounts
  useEffect(() => {
    return () => {
      setCheckoutUrl(null);
    };
  }, []);

  return {
    // Wallet data
    wallet,
    isWalletLoading,
    walletError,
    refetchWallet,

    // Payment methods
    paymentMethods,
    isPaymentMethodsLoading,
    paymentMethodsError,
    refetchPaymentMethods,
    addPaymentMethod,
    isAddingPaymentMethod,
    removePaymentMethod,
    isRemovingPaymentMethod,
    setDefaultPaymentMethod,
    isSettingDefaultPaymentMethod,

    // Transaction data
    recentTransactions,
    isTransactionsLoading,
    transactionsError,
    refetchTransactions,

    // Credit operations
    addCredits,
    isAddingCredits,
    useCredits,
    isUsingCredits,
    hasSufficientCredits,

    // Checkout
    createCheckoutSession,
    checkoutUrl,
    isCreatingCheckout,

    // Utility
    isLoading: isWalletLoading || isPaymentMethodsLoading || isTransactionsLoading,
    hasError: !!walletError || !!paymentMethodsError || !!transactionsError,

    // Force refetch all data
    refetchAll: () => {
      refetchWallet();
      refetchPaymentMethods();
      refetchTransactions();
    },
  };
};

/**
 * Hook for simple wallet balance display
 */
export const useWalletBalance = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: wallet,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.WALLET, userId],
    queryFn: () => (userId ? walletAPI.getWallet(userId) : null),
    enabled: !!userId,
  });

  return {
    balance: wallet?.availableBalance ?? 0,
    pendingBalance: wallet?.pendingBalance ?? 0,
    totalBalance: wallet?.balance ?? 0,
    isLoading,
    error,
    refetch,
  };

};

/**
 * Hook for handling checkout process with Stripe
 */

export const useCheckout = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createCheckoutSession = useCallback(
    async (options: Omit<CheckoutSessionOptions, 'userId'>) => {
      if (!userId) {
        setError(new Error('User not authenticated'));
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result: CheckoutSessionResult = (await stripeAPI.createCheckoutSession({
          ...options,
          userId,
        })) as CheckoutSessionResult;

        setCheckoutUrl(result.checkoutUrl);
        return result;
      } catch (err: unknown) {
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const clearCheckout = useCallback(() => {
    setCheckoutUrl(null);
    setError(null);
  }, []);

  // Clear state when component unmounts
  useEffect(() => {
    return () => {
      setCheckoutUrl(null);
      setError(null);
    };
  }, []);

  return {
    createCheckoutSession,
    checkoutUrl,
    isLoading,
    error,
    clearCheckout,
  };

};

/**
 * Hook for displaying transaction history
 */

export const useTransactionHistory = (options: { limit?: number; offset?: number } = {}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const { limit = 20, offset = 0 } = options;

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, userId, limit, offset],
    queryFn: () => (userId ? transactionsAPI.getTransactions(userId, { limit, offset }) : []),
    enabled: !!userId,
  });

  return {
    transactions: transactions || [],
    isLoading,
    error,
    refetch,

    // Helper functions
    getByType: (type: TransactionType) => transactions?.filter(t => t.type === type) || [],

    getCredit: () =>
      transactions?.filter(
        t => t.type === TransactionType.CREDIT_ADDITION || t.type === TransactionType.BONUS
      ) || [],
  };

};

