import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';

export interface PlatformCreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'refund' | 'bonus';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface PlatformCreditBalance {
  user_id: string;
  balance: number;
  pending_balance: number;
  last_updated: string;
}

// Get user's platform credit balance
export const getPlatformCreditBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (error) throw error;

    const balance =
      data?.reduce((total, transaction) => {
        if (transaction.transaction_type === 'credit' || transaction.transaction_type === 'bonus') {
          return total + transaction.amount;
        } else if (transaction.transaction_type === 'debit') {
          return total - transaction.amount;
        }
        return total;
      }, 0) || 0;

    return Math.max(0, balance); // Ensure balance is never negative
  } catch (error) {
    return 0;
  }
};

// Get user's credit transaction history
export const getCreditTransactionHistory = async (
  userId: string
): Promise<PlatformCreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transaction => ({
          ...transaction,
      transaction_type: transaction.transaction_type as 'credit' | 'debit' | 'refund' | 'bonus',
      status: (transaction.status || 'completed') as 'pending' | 'completed' | 'failed',
      user_id: transaction.user_id || '',
      description: transaction.description || '',
      reference_id: transaction.reference_id || undefined,
      created_at: transaction.created_at || new Date().toISOString(),
      updated_at: transaction.updated_at || new Date().toISOString(),
    }));
  } catch (error) {
    return [];
  }
};

// Add platform credit to user's account
export const addPlatformCredit = async (
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      transaction_type: 'credit',
      description: description,
      status: 'completed',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    toast.success(`$${amount.toFixed(2)} platform credit added successfully`);
    return true;
  } catch (error) {
    handleError(error, { userId, amount, description }, 'Failed to add platform credit');
    return false;
  }
};

// Deduct platform credit from user's account
export const deductPlatformCredit = async (
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<boolean> => {
  try {
    // First check if user has sufficient balance
    const currentBalance = await getPlatformCreditBalance(userId);

    if (currentBalance < amount) {
      handleError(
        new Error('Insufficient balance'),
        { userId, amount, currentBalance },
        'Insufficient platform credit balance'
      );
      return false;
    }

    const { error } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      transaction_type: 'debit',
      description: description,
      status: 'completed',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return true;
  } catch (error) {
    handleError(error, { userId, amount, description }, 'Failed to deduct platform credit');
    return false;
  }
};

// Transfer platform credit between users
export const transferPlatformCredit = async (
  fromUserId: string,
  toUserId: string,
  amount: number,
  description: string
): Promise<boolean> => {
  try {
    // Check if sender has sufficient balance
    const senderBalance = await getPlatformCreditBalance(fromUserId);

    if (senderBalance < amount) {
      handleError(
        new Error('Insufficient balance'),
        { fromUserId, toUserId, amount, senderBalance },
        'Insufficient platform credit balance for transfer'
      );
      return false;
    }

    // Create debit transaction for sender
    const { error: debitError } = await supabase.from('credit_transactions').insert({
      user_id: fromUserId,
      amount: amount,
      transaction_type: 'debit',
      description: `Transfer to user: ${description}`,
      status: 'completed',
      reference_id: `transfer_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (debitError) throw debitError;

    // Create credit transaction for receiver
    const { error: creditError } = await supabase.from('credit_transactions').insert({
      user_id: toUserId,
      amount: amount,
      transaction_type: 'credit',
      description: `Transfer from user: ${description}`,
      status: 'completed',
      reference_id: `transfer_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (creditError) throw creditError;

    toast.success(`$${amount.toFixed(2)} platform credit transferred successfully`);
    return true;
  } catch (error) {
    handleError(error, { fromUserId, toUserId, amount }, 'Failed to transfer platform credit');
    return false;
  }
};

// Refund platform credit
export const refundPlatformCredit = async (
  userId: string,
  amount: number,
  description: string,
  originalTransactionId?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      transaction_type: 'refund',
      description: description,
      status: 'completed',
      reference_id: originalTransactionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    toast.success(`$${amount.toFixed(2)} platform credit refunded successfully`);
    return true;
  } catch (error) {
    handleError(
      error,
      { userId, amount, originalTransactionId },
      'Failed to refund platform credit'
    );
    return false;
  }
};

// Validate platform credit transaction
export const validateCreditTransaction = (
  amount: number,
  transactionType: string,
  userId: string
): { isValid: boolean; error?: string } => {
  if (!userId) {
    return { isValid: false, error: 'User ID is required' };
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (!['credit', 'debit', 'refund', 'bonus'].includes(transactionType)) {
    return { isValid: false, error: 'Invalid transaction type' };
  }

  return { isValid: true };
};

// Additional functions for backward compatibility
export const canUsePlatformCredit = (options: unknown): boolean => {
  return options.isPlatformFee === true;
};

export const processPlatformCredit = async (options: unknown): Promise<any> => {
  if (!options.userId || !options.amount) {
    return { success: false, error: 'Missing required parameters' };
  }

  const success = await deductPlatformCredit(
    options.userId,
    options.amount,
    options.description || 'Platform payment'
  );

  return {
    success,
    redirectUrl: null,
    transactionId: `credit_${Date.now()}`,
  };
};

export const updatePlatformCredit = addPlatformCredit;
export const hasEnoughCredit = async (userId: string, amount: number): Promise<boolean> => {
  const balance = await getPlatformCreditBalance(userId);
  return balance >= amount;
};

export const addCreditTransaction = addPlatformCredit;
export const getPlatformCreditTransactions = getCreditTransactionHistory;
export const usePlatformCredit = deductPlatformCredit;

// Get platform credit statistics
export const getPlatformCreditStats = async (userId: string) => {
  try {
    const transactions = await getCreditTransactionHistory(userId);
    const balance = await getPlatformCreditBalance(userId);

    const totalCredits = transactions
      .filter(t => t.transaction_type === 'credit' || t.transaction_type === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunds = transactions
      .filter(t => t.transaction_type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentBalance: balance,
      totalCredits,
      totalDebits,
      totalRefunds,
      transactionCount: transactions.length,
      transactions,
    };
  } catch (error) {
    return {
      currentBalance: 0,
      totalCredits: 0,
      totalDebits: 0,
      totalRefunds: 0,
      transactionCount: 0,
      transactions: [],
    };
  }
};
