/**
 * @file Consolidated platform credit API functions
 */

import { supabaseService, getTableName } from '../core/client';
import { WALLET_BALANCE_FIELDS } from '../core/constants';
import {
  CreditProcessingOptions,
  TransactionRecord,
  TransactionStatus,
  TransactionType,
  WalletBalanceField,
  PlatformCredit,
  CreditTransaction,
  CreditTransactionType,
  CreditAllocation,
} from '../core/types';
import { handlePaymentError } from '../core/errors';
import { safeToast } from '@/services/api/utils/safeToast';

/**
 * Get the credit balance for a user
 * @param userId User ID
 * @returns The user's credit balance or 0 if not found
 */
export async function getBalance(userId: string): Promise<number> {
  try {
    if (!userId) return 0;

    const client = supabaseService.getRawClient();
    const { data, error } = await client
      .from(getTableName.wallets())
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found error
      throw error;
    }

    if (!data) {
      // Create wallet if it doesn't exist
      const { data: wallet } = await client
        .from(getTableName.wallets())
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'USD',
        })
        .select()
        .single();

      if (!wallet) {
        throw new Error('Failed to create wallet');
      }
      return 0;
    }

    // Check for the first available balance field
    const balanceField = WALLET_BALANCE_FIELDS.find(
      field => data[field as keyof typeof data] !== undefined
    ) as WalletBalanceField | undefined;

    if (!balanceField) {
      return 0;
    }

    // Get balance and ensure it's in decimal form (not cents)
    let balance = Number(data[balanceField]) as number;

    // Convert from cents if necessary
    if (balanceField === 'balance_in_cents') {
      balance = balance / 100;
    }

    return Math.max(0, balance); // Ensure balance is never negative
  } catch (error) {
    handlePaymentError(error, 'Failed to fetch credit balance');
    return 0;
  }
}

/**
 * Add credit to a user's account
 * @param userId User ID
 * @param amount Amount to add (decimal)
 * @param description Transaction description
 * @param referenceId Optional reference ID
 * @param metadata Optional metadata
 * @returns Success status
 */
export async function addCredit(options: {
  userId: string;
  amount: number;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const { userId, amount, description = 'Credit addition', referenceId, metadata } = options;

    if (!userId || amount <= 0) {
      return false;
    }

    const client = supabaseService.getRawClient();
    const { data: wallet, error: fetchError } = await client
      .from(getTableName.wallets())
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Not found error
      throw fetchError;
    }

    // Create wallet if it doesn't exist
    if (!wallet) {
      const { error: createError } = await client.from(getTableName.wallets()).insert({
        user_id: userId,
        balance: 0,
        currency: 'USD',
      });

      if (createError) {
        throw createError;
      }
    } else {
      // Update existing wallet
      const currentBalance =
        wallet.credit_balance !== undefined
          ? Number(wallet.credit_balance): wallet.balance !== undefined
            ? Number(wallet.balance): 0;

      const newBalance = currentBalance + amount;

      const { error: updateError } = await client
        .from(getTableName.wallets())
        .update({
          credit_balance: newBalance,
          balance: newBalance,
          balance_in_cents: Math.round(newBalance * 100),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }
    }

    // Record transaction
    const { error: transactionError } = await client.from(getTableName.transactions()).insert({
      user_id: userId,
      wallet_id: userId,
      amount_in_cents: Math.round(amount * 100),
      transaction_type: 'credit_addition',
      description,
      status: 'completed',
      reference_id: referenceId,
      created_at: new Date().toISOString(),
      metadata,
    });

    if (transactionError) {
      // Log but don't fail the operation since credit was already added
    }

    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to add credits');
    return false;
  }
}

/**
 * Deduct credit from a user's account
 * @param userId User ID
 * @param amount Amount to deduct (decimal)
 * @param description Transaction description
 * @param referenceId Optional reference ID
 * @param metadata Optional metadata
 * @returns Success status
 */
// Alias for better API naming
export const useCredit = deductCredit;

export async function deductCredit(options: {
  userId: string;
  amount: number;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const { userId, amount, description = 'Credit deduction', referenceId, metadata } = options;

    if (!userId || amount <= 0) {
      return false;
    }

    const client = supabaseService.getRawClient();

    // Check if user has enough credit
    const currentBalance = await getBalance(userId);

    if (currentBalance < amount) {
      safeToast.error('Insufficient credits');
      return false;
    }

    // Get wallet data to find the balance field
    const { data: wallet, error: fetchError } = await client
      .from(getTableName.wallets())
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Determine which balance field to use
    const balanceField = WALLET_BALANCE_FIELDS.find(
      field => wallet[field as keyof typeof wallet] !== undefined
    ) as WalletBalanceField;

    if (!balanceField) {
      return false;
    }

    // Calculate new balance
    let currentBalanceRaw = Number(wallet[balanceField]) as number;

    // Handle cents conversion if needed
    if (balanceField === 'balance_in_cents') {
      currentBalanceRaw = currentBalanceRaw / 100;
      currentBalanceRaw -= amount;
      currentBalanceRaw = Math.round(currentBalanceRaw * 100);
    } else {
      currentBalanceRaw -= amount;
    }

    // Create update data with safe typing
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    updateData[balanceField] = currentBalanceRaw;

    // Update wallet balance
    const updateResponse = await client
      .from(getTableName.wallets())
      .update(updateData)
      .eq('user_id', userId);

    if (updateResponse.error) {
      return false;
    }

    // Log the transaction
    const transactionInsert = await client.from(getTableName.transactions()).insert({
      wallet_id: userId,
      user_id: userId, // Add user_id for RLS policy compatibility
      amount_in_cents: Math.round(-amount * 100), // Negative amount for deduction
      description,
      transaction_type: TransactionType.CREDIT_DEDUCTION,
      status: TransactionStatus.COMPLETED,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
      metadata,
    });

    if (transactionInsert.error) {
      return false;
    }

    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to deduct credit');
    return false;
  }
}

/**
 * Get transaction history for a user
 * @param userId User ID
 * @param limit Maximum number of transactions to return
 * @param offset Pagination offset
 * @returns Array of transactions
 */
export async function getTransactions(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<TransactionRecord[]> {
  try {
    if (!userId) return [];

    const client = supabaseService.getRawClient();
    const { data, error } = await client
      .from(getTableName.transactions())
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handlePaymentError(error, 'Failed to fetch transactions');
    return [];
  }
}

/**
 * Check if a user has enough credit
 * @param userId User ID
 * @param amount Amount to check
 * @returns Whether user has enough credit
 */
export async function hasEnoughCredit(userId: string, amount: number): Promise<boolean> {
  if (!userId || amount <= 0) return false;

  const balance = await getBalance(userId);
  return balance >= amount;
}

/**
 * Process platform credit (for backward compatibility)
 * @param options Credit processing options
 * @returns Success status
 */
export async function processPlatformCredit(options: CreditProcessingOptions): Promise<boolean> {
  try {
    if (!options.userId) return false;

    if (options.operation === 'add') {
      return addCredit({
        userId: options.userId,
        amount: options.amount,
        description: options.description || 'Credit addition',
        referenceId: options.referenceId,
      });
    } else if (options.operation === 'deduct' || options.operation === 'use') {
      return deductCredit({
        userId: options.userId,
        amount: options.amount,
        description: options.description || 'Credit deduction',
        referenceId: options.referenceId,
      });
    }

    return false;
  } catch (error) {
    handlePaymentError(error, `Failed to ${options.operation} platform credit`);
    return false;
  }
}
