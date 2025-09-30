/**
 * @file Backward compatibility layer for platformCredit service
 * @deprecated Use consolidated payment API instead
 */

import {
  getBalance,
  addCredit,
  deductCredit,
  getTransactions,
  hasEnoughCredit,
} from '../api/credit';
import { formatCredits } from '../utils/formatters';

/**
 * Backward compatible version of the platform credit service
 * @deprecated Use the consolidated payment API instead
 */
export class PlatformCredit {
  /**
   * Get user credit balance
   * @deprecated Use payment/api/credit.getBalance instead
   */
  static async getBalance(userId: string): Promise<number> {
    return await getBalance(userId);
  }

  /**
   * Add credit to user's balance
   * @deprecated Use payment/api/credit.addCredit instead
   */
  static async addCredit(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string
  ): Promise<number | null> {
    const result = await addCredit({
      userId,
      amount,
      description,
      referenceId,
    });

    return result ? amount : null;
  }

  /**
   * Check if user has enough credit
   * @deprecated Use payment/api/credit.hasEnoughCredit instead
   */
  static async hasEnoughCredit(userId: string, amount: number): Promise<boolean> {
    return await hasEnoughCredit(userId, amount);
  }

  /**
   * Deduct credit from user's balance
   * @deprecated Use payment/api/credit.deductCredit instead
   */
  static async deductCredit(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    _metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const result = await deductCredit({
      userId,
      amount,
      description,
      referenceId,
    });

    return result;
  }

  /**
   * Get formatted credit balance
   * @deprecated Use payment/utils/formatters.formatCredits instead
   */
  static formatCredits(amount: number): string {
    return formatCredits(amount);
  }

  /**
   * Get credit transactions history
   * @deprecated Use payment/api/credit.getTransactions instead
   */
  static async getTransactions(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    const transactions = await getTransactions(userId, limit, offset);

    // Convert transactions to legacy format
    return transactions.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount_in_cents ? transaction.amount_in_cents / 100 : 0,
      description: transaction.description,
      transaction_type: transaction.transaction_type,
      created_at: transaction.created_at,
      reference_id: transaction.reference_id,
      metadata: transaction.metadata,
    }));
  }
}

export async function addPlatformCredit(
  userId: string,
  amount: number,
  description?: string,
  _metadata?: Record<string, unknown>
): Promise<boolean> {
  return await addCredit({
    userId,
    amount,
    description: description || 'Platform credit addition',
    metadata: _metadata,
  });
}
