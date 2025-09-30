/**
 * @file Backward compatibility layer for wallet service
 * @deprecated Use consolidated payment API instead
 */

import { ensureWalletExists, getWallet, updateWallet, getFormattedBalance } from '../api/wallet';
import { createTransaction } from '../api/transactions';
import { TransactionType } from '../core/types';

/**
 * Get wallet balance
 * @deprecated Use payment/api/wallet.getWallet and access balance instead
 */
export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await getWallet(userId);
  return wallet?.balance || 0;
}

/**
 * Create wallet if not exists
 * @deprecated Use payment/api/wallet.ensureWalletExists instead
 */
export async function createWalletIfNotExists(
  userId: string,
  initialBalance: number = 0
): Promise<boolean> {
  const wallet = await ensureWalletExists(userId, { initialBalance });
  return !!wallet;
}

/**
 * Get formatted balance
 * @deprecated Use payment/api/wallet.getFormattedBalance instead
 */
export async function getFormattedWalletBalance(
  userId: string,
  currency: string = 'USD'
): Promise<string> {
  return await getFormattedBalance(userId);
}

/**
 * Update wallet balance
 * @deprecated Use payment/api/wallet.updateWallet instead
 */
export async function updateWalletBalance(userId: string, amount: number): Promise<boolean> {
  const wallet = await getWallet(userId);
  const currentBalance = wallet?.balance || 0;

  const updatedWallet = await updateWallet(userId, {
    balance: currentBalance + amount,
  });

  return !!updatedWallet;
}

/**
 * Get wallet transactions
 * @deprecated Use payment/api/transactions.getTransactionHistory instead
 */
export async function getWalletTransactions(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  // Import here to avoid circular dependency
  const { getTransactionHistory } = await import('../api/transactions');

  const transactions = await getTransactionHistory(userId, {
    limit,
    offset,
  });

  return transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    transaction_type: t.type,
    created_at: t.createdAt,
    reference_id: t.referenceId,
    metadata: t.metadata,
  }));
}

/**
 * Create wallet transaction
 * @deprecated Use payment/api/transactions.createTransaction instead
 */
export async function createWalletTransaction(
  userId: string,
  amount: number,
  description: string,
  type: string,
  referenceId?: string,
  metadata?: Record<string, unknown>
): Promise<any> {
  // Map the old transaction types to new ones
  let transactionType: TransactionType;

  switch (type.toLowerCase()) {
    case 'deposit':
    case 'credit':
    case 'add':
      transactionType = TransactionType.CREDIT_ADDITION;
      break;
    case 'withdraw':
    case 'debit':
    case 'deduct':
      transactionType = TransactionType.CREDIT_DEDUCTION;
      break;
    case 'payment':
      transactionType = TransactionType.PAYMENT;
      break;
    case 'refund':
      transactionType = TransactionType.REFUND;
      break;
    default:
      transactionType = TransactionType.MISCELLANEOUS;
  }

  const transaction = await createTransaction(userId, amount, transactionType, description, {
    referenceId,
    metadata,
  });

  if (!transaction) return null;

  // Return in the old format
  return {
    id: transaction.id,
    amount: transaction.amount,
    description: transaction.description,
    transaction_type: transaction.type,
    created_at: transaction.createdAt,
    reference_id: transaction.referenceId,
    metadata: transaction.metadata,
  };
}
