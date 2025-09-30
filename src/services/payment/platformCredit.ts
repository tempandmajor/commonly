/**
 * Platform Credit Service
 *
 * Handles platform credit operations including checking balances,
 * processing credit-based payments, and managing credit transactions.
 */

import { safeToast } from '@/services/api/utils/safeToast';
import { supabaseService } from '../supabase';
import { PaymentRecordData } from './types';
import { createPaymentRecord } from './utils/paymentRecord';

export interface PlatformCreditService {
  getBalance: (userId: string) => Promise<number>;
  deductCredit: (userId: string, amount: number, description?: string) => Promise<boolean> | undefined;
  addCredit: (userId: string, amount: number, description?: string) => Promise<boolean> | undefined;
  getTransactions: (userId: string, limit?: number) => Promise<TransactionRecord[]> | undefined;
}

export interface CreditProcessingOptions extends PaymentRecordData {
  userId: string;
  title?: string;
}

/**
 * Process a payment using platform credit
 *
 * @param options Payment options including amount and metadata
 * @returns True if credit was successfully used for payment
 */
// Define simplified types to avoid deep type instantiations
type WalletRecord = {
  user_id: string;
  credit_balance?: number;
  credits?: number;
  balance?: number;
  updated_at: string;
};

// Define a transaction type that matches the actual database schema
type TransactionRecord = {
  id?: string;
  user_id?: string;
  wallet_id?: string; // Make this optional since the DB might use user_id instead
  amount_in_cents: number;
  description: string;
  transaction_type: string;
  status: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>; // Using proper type instead of any
};

// Specific type for wallet fields to allow dynamic field access
type WalletBalanceField = 'credit_balance' | 'credits' | 'balance';

export async function processPlatformCredit(options: CreditProcessingOptions): Promise<boolean> {
  if (!options.userId || !options.amount) {
    return false;
  }

  try {
    // Get user's current balance
    const balance = await platformCreditService.getBalance(options.userId);

    // Check if user has enough credit
    if (balance < options.amount) {
      return false;
    }

    // Deduct credit from user's account
    const success = await platformCreditService.deductCredit(
      options.userId,
      options.amount,
      options.description || options.title || 'Platform credit payment'
    );

    if (!success) {
      return false;
    }

    // Create a payment record
    const amount_in_cents = Math.round(options.amount * 100);
    await createPaymentRecord({
      amount_in_cents,
      user_id: options.userId,
      customer_id: options.customerId,
      status: 'completed',
      payment_method: 'platform_credit',
      currency: options.currency || 'usd',
      description: options.description || 'Platform credit payment',
      metadata: {
          ...options.metadata,
        paymentType: 'platform_credit',
        timestamp: new Date().toISOString(),
        creatorId: options.creatorId,
        eventId: options.eventId,
      },
    });

    return true;
  } catch (error) {
    safeToast.error('Failed to process platform credit');
    return false;
  }
}

/**
 * Platform Credit Service Implementation
 */
export const platformCreditService: PlatformCreditService = {
  /**
   * Get a user's current credit balance
   *
   * @param userId User ID
   * @returns Current balance amount
   */
  getBalance: async (userId: string) => {
    try {
      if (!userId) return 0;

      // Query wallet - use a more resilient approach to handle schema variations
      const walletResponse = await supabaseService
        .getRawClient()
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletResponse.error) {
        return 0;
      }

      // Use our simplified wallet type
      const wallet = walletResponse.data as WalletRecord;

      // Try different possible field names for credits
      const balance = wallet?.credit_balance ?? wallet?.credits ?? wallet?.balance ?? 0;
      return balance;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Deduct credit from a user's account
   *
   * @param userId User ID
   * @param amount Amount to deduct
   * @param description Transaction description
   * @returns Success status
   */
  deductCredit: async (userId: string, amount: number, description = 'Credit deduction') => {
    try {
      if (!userId || amount <= 0) return false;

      // Query wallet once to determine fields and get current balance
      const walletResponse = await supabaseService
        .getRawClient()
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletResponse.error) {
        return false;
      }

      // Cast to our simplified type to avoid deep type instantiation
      const wallet = walletResponse.data as WalletRecord;

      // Determine field name and current balance
      let balanceField = 'credit_balance';
      let currentBalance = 0;

      // Check which field exists and has a value
      if ('credit_balance' in wallet) {
        balanceField = 'credit_balance';
        currentBalance = wallet.credit_balance || 0;
      } else if ('credits' in wallet) {
        balanceField = 'credits';
        currentBalance = wallet.credits || 0;
      } else {
        balanceField = 'balance';
        currentBalance = wallet.balance || 0;
      }

      // Check if user has sufficient balance
      if (currentBalance < amount) {
        return false;
      }

      // Update balance in wallet table
      const updateData: Record<string, number | string> = {
        updated_at: new Date().toISOString(),
      };
      updateData[balanceField] = currentBalance - amount;

      // Update wallet balance
      const updateResponse = await supabaseService
        .getRawClient()
        .from('wallets')
        .update(updateData)
        .eq('user_id', userId);

      if (updateResponse.error) {
        return false;
      }

      // Log the transaction
      const transactionInsert = await supabaseService
        .getRawClient()
        .from('transactions')
        .insert({
          wallet_id: userId, // Using wallet_id which is likely the user ID
          amount_in_cents: Math.round(-amount * 100), // Convert to cents and make negative
          description,
          transaction_type: 'credit_deduction',
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (transactionInsert.error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Add credit to a user's account
   *
   * @param userId User ID
   * @param amount Amount to add
   * @param description Transaction description
   * @returns Success status
   */
  addCredit: async (userId: string, amount: number, description = 'Credit added') => {
    try {
      if (!userId || amount <= 0) return false;

      // Query wallet once to determine fields and get current balance
      const walletResponse = await supabaseService
        .getRawClient()
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletResponse.error) {
        return false;
      }

      // Cast to our simplified type to avoid deep type instantiation
      const wallet = walletResponse.data as WalletRecord;

      // Determine field name and current balance
      let balanceField = 'credit_balance';
      let currentBalance = 0;

      // Check which field exists and has a value
      if ('credit_balance' in wallet) {
        balanceField = 'credit_balance';
        currentBalance = wallet.credit_balance || 0;
      } else if ('credits' in wallet) {
        balanceField = 'credits';
        currentBalance = wallet.credits || 0;
      } else {
        balanceField = 'balance';
        currentBalance = wallet.balance || 0;
      }

      // Update the balance
      // Create update data with safe typing
      const updateData: Record<string, number | string> = {
        updated_at: new Date().toISOString(),
      };

      // Set the balance field dynamically
      updateData[balanceField] = currentBalance + amount;

      // Update wallet
      const updateResponse = await supabaseService
        .getRawClient()
        .from('wallets')
        .update(updateData)
        .eq('user_id', userId);

      if (updateResponse.error) {
        return false;
      }

      // Create transaction record as a plain object for Supabase compatibility
      const transactionInsert = await supabaseService
        .getRawClient()
        .from('transactions')
        .insert({
          wallet_id: userId,
          amount_in_cents: Math.round(amount * 100), // Convert to cents
          description,
          transaction_type: 'credit_addition',
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (transactionInsert.error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get a user's credit transactions
   *
   * @param userId User ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transaction records
   */
  getTransactions: async (userId: string, limit = 10): Promise<TransactionRecord[]> => {
    try {
      if (!userId) return [];

      // Get credit transactions from transactions table
      const { data, error } = await supabaseService
        .getRawClient()
        .from('transactions')
        .select('*')
        .eq('wallet_id', userId)
        .in('transaction_type', ['credit_addition', 'credit_deduction'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      // Cast the data to our TransactionRecord type to ensure compatibility
      return (data || []) as TransactionRecord[];
    } catch (error) {
      return [];
    }
  },
};
