import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '@/types/auth';
import { getPaymentMethods as getPaymentMethodsService } from '@/services/supabase/edge-functions';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  date: Date;
  description?: string | undefined;
  [key: string]: unknown;
}

export const usePaymentSettings = () => {
  const { user } = useAuth() as AuthContextType;
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    autoPayWithCredit: true,
    defaultPaymentMethod: 'card',
  });
  const [platformCredit, setPlatformCredit] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [processingCredit, setProcessingCredit] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get user settings
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        throw settingsError;
      }

      if (userSettings) {
        setPreferences(
          userSettings.payment_preferences || {
            autoPayWithCredit: true,
            defaultPaymentMethod: 'card',
          }
        );
        setPlatformCredit(userSettings.platform_credit || 0);
      } else {
        // Create default settings if they don't exist
        const defaultSettings = {
          user_id: user.id,
          platform_credit: 0,
          payment_preferences: {
            autoPayWithCredit: true,
            defaultPaymentMethod: 'card',
          },
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('user_settings').insert(defaultSettings);

        if (insertError) throw insertError;

        setPreferences({
          autoPayWithCredit: true,
          defaultPaymentMethod: 'card',
        });
      }

      // Get payment methods via service (BFF preferred)
      try {
        const resp = await getPaymentMethodsService();
        const methods = (resp?.paymentMethods || []) as any[];
        const mapped: PaymentMethod[] = methods.map((m: any) => ({
          id: m.id,
          type: m.type || 'card',
          last4: m.card?.last4 || m.last4 || '',
          expMonth: m.card?.exp_month || m.exp_month || 0,
          expYear: m.card?.exp_year || m.exp_year || 0,
          isDefault: !!m.is_default,
        }));
        setPaymentMethods(mapped);
      } catch (_e) {
        setPaymentMethods([]);
      }

      // Get transactions (if present)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('history')
        .eq('user_id', user.id)
        .single();

      if (transactionsError && transactionsError.code !== 'PGRST116') {
        throw transactionsError;
      }

      if (transactionsData && Array.isArray(transactionsData.history)) {
        setTransactions(
          transactionsData.history.map((tx: any) => ({
          ...tx,
            date: tx.date ? new Date(tx.date) : new Date(),
          }))
        );
      }
    } catch (_error) {
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          payment_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Preferences saved successfully');
    } catch (_error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    preferences,
    setPreferences,
    platformCredit,
    paymentMethods,
    customAmount,
    setCustomAmount,
    processingCredit,
    transactions,
    handleSavePreferences,
  };
};
