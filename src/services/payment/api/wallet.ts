/**
 * @file Consolidated wallet API functions
 */

import { supabaseService, getTableName } from '../core/client';
import { handlePaymentError } from '../core/errors';
import { Wallet, WalletRecord } from '../core/types';

/**
 * Create a wallet for a user if it doesn't exist
 * @param userId User ID
 * @returns The created or existing wallet
 */
export async function ensureWalletExists(userId: string): Promise<WalletRecord | null> {
  try {
    if (!userId) return null;

    const client = supabaseService.getRawClient();

    // Check if wallet exists
    const { data: existingWallet, error: fetchError } = await client
      .from(getTableName.wallets())
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Not found error
      throw fetchError;
    }

    if (existingWallet) {
      return existingWallet;
    }

    // Create wallet if it doesn't exist
    const { data: newWallet, error: createError } = await client
      .from(getTableName.wallets())
      .insert({
        user_id: userId,
        credit_balance: 0,
        balance: 0,
        balance_in_cents: 0,
        available_balance_in_cents: 0,
        pending_balance_in_cents: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;
    return newWallet;
  } catch (error) {
    handlePaymentError(error, 'Failed to ensure wallet exists');
    return null;
  }
}

/**
 * Get a user's wallet
 * @param userId User ID
 * @returns The user's wallet or null if not found
 */
export async function getWallet(userId: string): Promise<Wallet | null> {
  try {
    if (!userId) return null;

    // Ensure wallet exists
    const walletRecord = await ensureWalletExists(userId);

    if (!walletRecord) {
      return null;
    }

    // Normalize the wallet data
    return normalizeWalletRecord(walletRecord);
  } catch (error) {
    handlePaymentError(error, 'Failed to get wallet');
    return null;
  }
}

/**
 * Update a wallet with specified fields
 * @param userId User ID
 * @param updateData Fields to update
 * @returns Success status
 */
export async function updateWallet(userId: string, updateData: Partial<Wallet>): Promise<boolean> {
  try {
    if (!userId || (Object.keys(updateData) as (keyof typeof updateData)[]).length === 0) {
      return false;
    }

    const client = supabaseService.getRawClient();

    // Ensure wallet exists
    await ensureWalletExists(userId);

    // Convert to database format
    const dbUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map API fields to database fields
    if (updateData.balance !== undefined) {
      dbUpdateData.credit_balance = updateData.balance;
      dbUpdateData.balance = updateData.balance;
      dbUpdateData.balance_in_cents = Math.round(updateData.balance * 100);
    }

    if (updateData.availableBalance !== undefined) {
      dbUpdateData.available_balance_in_cents = Math.round(updateData.availableBalance * 100);
    }

    if (updateData.pendingBalance !== undefined) {
      dbUpdateData.pending_balance_in_cents = Math.round(updateData.pendingBalance * 100);
    }

    if (updateData.metadata !== undefined) {
      dbUpdateData.metadata = updateData.metadata;
    }

    // Update wallet
    const { error } = await client
      .from(getTableName.wallets())
      .update(dbUpdateData)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to update wallet');
    return false;
  }
}

/**
 * Get a formatted wallet balance
 * @param userId User ID
 * @returns Formatted balance object
 */
export async function getFormattedBalance(userId: string): Promise<{
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  formattedBalance: string;
}> {
  try {
    const wallet = await getWallet(userId);

    if (!wallet) {
      return {
        balance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        formattedBalance: '$0.00',
      };
    }

    return {
      balance: wallet.balance,
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      formattedBalance: formatCurrency(wallet.balance),
    };
  } catch (error) {
    handlePaymentError(error, 'Failed to get formatted balance');
    return {
      balance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      formattedBalance: '$0.00',
    };
  }
}

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Convert a wallet record to the normalized Wallet interface
 * @param record Wallet record from database
 * @returns Normalized wallet object
 */
function normalizeWalletRecord(record: WalletRecord): Wallet {
  // Determine balance - check each possible field
  let balance = 0;
  if (record.credit_balance !== undefined) {
    balance = Number(record.credit_balance) as number;
  } else if (record.credits !== undefined) {
    balance = Number(record.credits) as number;
  } else if (record.balance !== undefined) {
    balance = Number(record.balance) as number;
  } else if (record.balance_in_cents !== undefined) {
    balance = Number(record.balance_in_cents) as number / 100;
  }

  // Get available and pending balances
  const availableBalance =
    record.available_balance_in_cents !== undefined
      ? Number(record.available_balance_in_cents) as number / 100
      : balance;

  const pendingBalance =
    record.pending_balance_in_cents !== undefined
      ? Number(record.pending_balance_in_cents) as number / 100
      : 0;

  return {
    id: record.id,
    userId: record.user_id,
    balance,
    availableBalance,
    pendingBalance,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
    metadata: record.metadata as Record<string, unknown> | undefined,
  };
}
