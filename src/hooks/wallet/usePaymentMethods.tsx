import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { PaymentMethod } from '@/services/wallet/types';
import { toast } from 'sonner';

export const usePaymentMethods = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch payment methods from user profile
  const fetchPaymentMethods = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // For now, return empty array since we don't have payment methods storage implemented
      // In a full implementation, this would integrate with Stripe's payment methods API
      // and store the payment method IDs securely in the database

      setPaymentMethods([]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  // Load payment methods on mount and when user changes
  useEffect(() => {
    fetchPaymentMethods();
  }, [user?.id]);

  const addCard = async (
    cardNumber: string,
    expiryMonth: string,
    expiryYear: string,
    cvc: string
  ) => {
    if (!user?.id) {
      toast.error('Please log in to add a payment method');
      return null;
    }

    try {
      setIsProcessing(true);

      // In a real implementation, this would:
      // 1. Create a Stripe payment method
      // 2. Store the payment method ID securely
      // 3. Never store actual card details

      // For now, we'll create a mock entry with last 4 digits only
      const last4 = cardNumber.slice(-4);
      const newCard: PaymentMethod = {
        id: `card_${Date.now()}`,
        type: 'card',
        last4,
        brand: getCardBrand(cardNumber),
        expMonth: parseInt(expiryMonth),
        expYear: parseInt(expiryYear),
        isDefault: paymentMethods.length === 0,
        createdAt: new Date(),
      };

      // In a full implementation, this would create a Stripe payment method
      // For now, just add to local state
      setPaymentMethods(prev => [...prev, newCard]);
      toast.success('Card added successfully (demo mode)');
      return newCard.id;
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const redirectToStripeConnect = async () => {
    if (!user?.id) {
      toast.error('Please log in to manage your bank account');
      return;
    }

    try {
      setIsProcessing(true);

      // Redirect users to their Stripe Connect dashboard to manage bank accounts
      // This is where they can add bank accounts, view payouts, and manage withdrawals
      toast.info('Redirecting to Stripe Connect dashboard...');

      // In a real implementation, you would:
      // 1. Get the user's Stripe Connect account ID from your database
      // 2. Create a Stripe Connect login link
      // 3. Redirect the user to their Stripe Express dashboard

      // For now, show a message explaining the process
      toast.success(
        'Bank account management is handled through your Stripe Connect dashboard where you can securely add bank accounts and manage withdrawals.'
      );
    } catch (error) {
      console.error('Error redirecting to Stripe Connect:', error);
      toast.error('Failed to access Stripe Connect dashboard');
    } finally {
      setIsProcessing(false);
    }
  };

  const removePaymentMethod = async (methodId: string) => {
    if (!user?.id) return false;

    try {
      setIsProcessing(true);

      const updatedMethods = paymentMethods.filter(method => method.id !== methodId);

      // In a full implementation, this would remove the payment method from Stripe
      // For now, just update local state
      setPaymentMethods(updatedMethods);
      toast.success('Payment method removed (demo mode)');
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    if (!user?.id) return false;

    try {
      setIsProcessing(true);

      const updatedMethods = paymentMethods.map(method => ({
          ...method,
        isDefault: method.id === methodId,
      }));

      // In a full implementation, this would update the default payment method in Stripe
      // For now, just update local state
      setPaymentMethods(updatedMethods);
      toast.success('Default payment method updated (demo mode)');
      return true;
    } catch (error) {
      console.error('Error setting default method:', error);
      toast.error('Failed to update default payment method');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to determine card brand from number
  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');

    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6011|^65/.test(number)) return 'discover';

    return 'unknown';
  };

  return {
    paymentMethods,
    loading,
    isProcessing,
    addCard,
    redirectToStripeConnect,
    removePaymentMethod,
    setDefaultMethod,
    refetch: fetchPaymentMethods,
  };
};
