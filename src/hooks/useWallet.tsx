import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PaymentMethod } from '@commonly/types';
import {
  getPaymentMethods as getPaymentMethodsService,
  createSetupIntent as createSetupIntentService,
  deletePaymentMethod as deletePaymentMethodService,
  setDefaultPaymentMethodEdge as setDefaultPaymentMethodService,
} from '@/services/supabase/edge-functions';

export const useWallet = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [formattedBalance, setFormattedBalance] = useState('$0.00');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [secretKey, setSecretKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance_in_cents')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const balanceInCents = data?.balance_in_cents || 0;
      setBalance(balanceInCents);
      setFormattedBalance(`$${(balanceInCents / 100).toFixed(2)}`);
    } catch (_error) {
      // noop
    }
  };

  const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
    if (!user) return [];
    try {
      const resp = await getPaymentMethodsService();
      const methods = (resp?.paymentMethods || []) as PaymentMethod[];
      return methods;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
      return [];
    }
  };

  const paymentMethodsQuery = useQuery<PaymentMethod[], Error>({
    queryKey: ['payment-methods', user?.id],
    queryFn: fetchPaymentMethods,
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (paymentMethodsQuery.data) {
      setPaymentMethods(paymentMethodsQuery.data);
    } else if (paymentMethodsQuery.isError) {
      setPaymentMethods([]);
    }
  }, [paymentMethodsQuery.data, paymentMethodsQuery.isError]);

  const addFunds = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!user) {
        toast.error('Please sign in to add funds');
        return false;
      }

      setIsLoading(true);
      try {
        const result = await supabase.functions.invoke('create-checkout-session', {
          body: {
            amount,
            currency: 'usd',
            description: `Add $${amount} to wallet`,
            success_url: `${window.location.origin}/wallet/success`,
            cancel_url: `${window.location.origin}/wallet`,
            metadata: { type: 'wallet_topup' },
          },
        });

        if (result.error) throw result.error;

        if (result.data?.url) {
          window.location.href = result.data.url;
          return true;
        }

        throw new Error('No checkout URL received');
      } catch (_error) {
        toast.error('Failed to add funds');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const withdrawFunds = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!user) {
        toast.error('Please sign in to withdraw funds');
        return false;
      }

      setIsLoading(true);
      try {
        // Create withdrawal transaction
        const { data: transaction, error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            amount_cents: Math.round(amount * 100), // Convert to cents
            type: 'withdrawal',
            description: `Withdrawal of $${amount.toFixed(2)}`,
            status: 'pending',
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Call withdrawal processing function
        const { data: result, error: withdrawalError } = await supabase.functions.invoke(
          'process-withdrawal',
          {
            body: {
              amount_cents: Math.round(amount * 100),
              user_id: user.id,
              transaction_id: transaction.id,
            },
          }
        );

        if (withdrawalError) throw withdrawalError;

        if (result?.success) {
          toast.success('Withdrawal initiated successfully');
          await fetchWalletBalance(); // Refresh balance
          return true;
        } else {
          throw new Error('Withdrawal failed');
        }
      } catch (error) {
        console.error('Withdrawal error:', error);
        toast.error('Failed to withdraw funds');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const transferFunds = useCallback(
    async (recipientId: string, amount: number): Promise<boolean> => {
      if (!user) {
        toast.error('Please sign in to transfer funds');
        return false;
      }

      if (user.id === recipientId) {
        toast.error('You cannot transfer funds to yourself');
        return false;
      }

      setIsLoading(true);
      try {
        // Create transfer transaction
        const { data: transaction, error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            amount_cents: Math.round(amount * 100), // Convert to cents
            type: 'transfer',
            description: `Transfer of $${amount.toFixed(2)} to user ${recipientId}`,
            status: 'pending',
            metadata: { recipient_id: recipientId },
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Call transfer processing function
        const { data: result, error: transferError } = await supabase.functions.invoke(
          'process-transfer',
          {
            body: {
              amount_cents: Math.round(amount * 100),
              sender_id: user.id,
              recipient_id: recipientId,
              transaction_id: transaction.id,
            },
          }
        );

        if (transferError) throw transferError;

        if (result?.success) {
          toast.success('Transfer completed successfully');
          await fetchWalletBalance(); // Refresh balance
          return true;
        } else {
          throw new Error('Transfer failed');
        }
      } catch (error) {
        console.error('Transfer error:', error);
        toast.error('Failed to transfer funds');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const addCard = useCallback(async () => {
    try {
      setIsProcessing(true);
      const _result = await createSetupIntentService();
      toast.success('Payment method setup initiated');
      await fetchPaymentMethods();
    } catch (_error) {
      toast.error('Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const removeMethod = useCallback(async (paymentMethodId: string) => {
    try {
      setIsProcessing(true);
      await deletePaymentMethodService(paymentMethodId);
      toast.success('Payment method removed');
      await fetchPaymentMethods();
    } catch (_error) {
      toast.error('Failed to remove payment method');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const setDefaultMethod = useCallback(async (paymentMethodId: string) => {
    try {
      setIsProcessing(true);
      await setDefaultPaymentMethodService(paymentMethodId);
      await fetchPaymentMethods();
      toast.success('Default payment method updated');
    } catch (_error) {
      toast.error('Failed to update default payment method');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateSecretKeyMethods = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Generate and store secret key for user's wallet
      const { data, error } = await supabase
        .from('user_wallet_keys')
        .insert({
          ...(user && {
            user_id: user.id,
            key_type: 'secret',
            created_at: new Date().toISOString()
          }),
        })
        .select()
        .single();

      if (error) throw error;

      setSecretKey(data.key_value || `sk_${user?.id}_${Date.now()}`);
      toast.success('Secret key generated');

    } catch (_error) {
      toast.error('Failed to generate secret key');
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id]);

  const withdraw = withdrawFunds; // Alias for compatibility

  return {
    isLoading,
    balance,
    formattedBalance,
    paymentMethods,
    secretKey,
    isProcessing,
    addFunds,
    withdrawFunds,
    transferFunds,
    withdraw,
    addCard,
    removeMethod,
    setDefaultMethod,
    generateSecretKeyMethods,
    refetchPaymentMethods: paymentMethodsQuery.refetch,
  };

};
