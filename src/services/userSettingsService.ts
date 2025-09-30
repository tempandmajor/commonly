import { supabase } from '@/integrations/supabase/client';

export interface UserSettings {
  id?: string | undefined;
  userId: string;
  platformCredit: number;
  paymentPreferences: {
    defaultMethod: 'stripe' | 'platform_credit';
    autoRecharge: boolean;
    rechargeAmount: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    eventReminders: boolean;
    promotions: boolean;
  };
  privacy: {
    isPrivate: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error || !data) {
      return null;
    }

    // Safely parse payment_settings and preferences
    let paymentSettings = {
      defaultMethod: 'stripe' as const,
      autoRecharge: false,
      rechargeAmount: 0,
    };

    if (data.payment_settings && typeof data.payment_settings === 'object') {
      const settings = data.payment_settings as unknown;
      paymentSettings = {
        defaultMethod: settings.defaultMethod || 'stripe',
        autoRecharge: settings.autoRecharge || false,
        rechargeAmount: settings.rechargeAmount || 0,
      };
    }

    let notifications = {
      email: true,
      push: true,
      eventReminders: true,
      promotions: false,
    };

    let privacy = {
      isPrivate: false,
      showEmail: false,
      showPhone: false,
    };

    if (data.preferences && typeof data.preferences === 'object') {
      const prefs = data.preferences as unknown;
      if (prefs.notifications) {
        notifications = { ...notifications, ...prefs.notifications };
      }
      if (prefs.privacy) {
        privacy = { ...privacy, ...prefs.privacy };
      }
    }

    return {
      id: data.id,
      userId: data.id,
      platformCredit: 0,
      paymentPreferences: paymentSettings,
      notifications,
      privacy,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    return null;
  }
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        payment_settings: settings.paymentPreferences,
        preferences: {
          notifications: settings.notifications,
          privacy: settings.privacy,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const initializeUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        payment_settings: {
          defaultMethod: 'stripe',
          autoRecharge: false,
          rechargeAmount: 0,
        },
        preferences: {
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
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.id,
      platformCredit: 0,
      paymentPreferences: data.payment_settings as unknown,
      notifications: (data.preferences as unknown)?.notifications || {
        email: true,
        push: true,
        eventReminders: true,
        promotions: false,
      },
      privacy: (data.preferences as unknown)?.privacy || {
        isPrivate: false,
        showEmail: false,
        showPhone: false,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    return null;
  }
};

// Add missing exports
export const getUserTransactions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    return [];
  }
};

export const addPlatformCredit = async (userId: string, amount: number): Promise<boolean> => {
  try {
    // Add a credit transaction record
    const { error } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: Math.round(amount * 100), // Convert to cents
      transaction_type: 'credit_purchase',
      description: `Added ${amount} platform credits`,
      status: 'completed',
    });

    if (error) throw error;

    return true;
  } catch (error) {
    return false;
  }
};
