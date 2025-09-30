import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserSettings,
  updateUserSettings,
  getUserTransactions,
  addPlatformCredit,
  UserSettings,
} from '@/services/userSettingsService';
import { toast } from 'sonner';

export const usePaymentSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    userId: '',
    platformCredit: 0,
    paymentPreferences: {
      defaultMethod: 'stripe',
      autoRecharge: false,
      rechargeAmount: 0,
    },
    notifications: {
      email: true,
      push: true,
      eventReminders: true,
      promotions: false,
    },
    privacy: {
      isPrivate: false,
      showEmail: false,
      showPhone: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [processingCredit, setProcessingCredit] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userSettings = await getUserSettings(user.id);
        if (userSettings) {
          setSettings(userSettings);
        }

        // Fetch transactions
        const userTransactions = await getUserTransactions(user.id);
        setTransactions(userTransactions);
      } catch (error) {
        toast.error('Failed to load payment settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  const updatePaymentPreference = async (key: string, value: unknown) => {
    if (!user?.id) return;

    try {
      // Optimistically update UI
      setSettings(prev => ({
          ...prev,
        paymentPreferences: {
          ...prev.paymentPreferences,
          [key]: value,
        },
      }));

      // Update in database
      await updateUserSettings(user.id, {
        paymentPreferences: {
          ...settings.paymentPreferences,
          [key]: value,
        },
      });

      toast.success('Payment preference updated');
    } catch (error) {
      toast.error('Failed to update payment preference');
    }
  };

  const addCredit = async (amount: number | string) => {
    if (!user?.id) return;

    setProcessingCredit(true);
    try {
      // Convert string amount to number if needed
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

      if (isNaN(numAmount) || numAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      const success = await addPlatformCredit(user.id, numAmount);

      if (success) {
        toast.success(`${numAmount} credits added to your account`);
        // Refresh settings after adding credit
        const updatedSettings = await getUserSettings(user.id);
        if (updatedSettings) {
          setSettings(updatedSettings);
        }

        // Refresh transactions
        const userTransactions = await getUserTransactions(user.id);
        setTransactions(userTransactions);

        setCustomAmount('');
      } else {
        toast.error('Failed to add credit');
      }
    } catch (error) {
      toast.error('Failed to add credit');
    } finally {
      setProcessingCredit(false);
    }
  };

  return {
    settings,
    isLoading,
    loading: isLoading,
    platformCredit: settings.platformCredit || 0,
    updatePaymentPreference,
    customAmount,
    setCustomAmount,
    processingCredit,
    transactions,
    addCredit,
  };
};
