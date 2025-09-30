/**
 * @file Consolidated transaction API functions
 */

import { supabaseService, getTableName } from '../core/client';
import { handlePaymentError } from '../core/errors';
import { Transaction, TransactionRecord, TransactionStatus, TransactionType } from '../core/types';

/**
 * Create a new transaction record
 * @param userId User ID
 * @param amount Amount in decimal (negative for deductions)
 * @param type Transaction type
 * @param description Transaction description
 * @param options Additional options
 * @returns Created transaction or null on failure
 */
export async function createTransaction(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  options: {
    referenceId?: string;
    metadata?: Record<string, unknown>;
    status?: TransactionStatus;
    walletId?: string;
  } = {}
): Promise<Transaction | null> {
  try {
    if (!userId) return null;

    const client = supabaseService.getRawClient();

    const transactionRecord: Partial<TransactionRecord> = {
      user_id: userId,
      wallet_id: options.walletId || userId,
      amount_in_cents: Math.round(amount * 100),
      transaction_type: type,
      description,
      status: options.status || TransactionStatus.COMPLETED,
      reference_id: options.referenceId,
      created_at: new Date().toISOString(),
      metadata: options.metadata || {},
    };

    const { data, error } = await client
      .from(getTableName.transactions())
      .insert(transactionRecord)
      .select()
      .single();

    if (error) throw error;

    return normalizeTransactionRecord(data);
  } catch (error) {
    handlePaymentError(error, 'Failed to create transaction');
    return null;
  }
}

/**
 * Get transaction history for a user
 * @param userId User ID
 * @param options Query options
 * @returns Array of transactions
 */
export async function getTransactionHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: TransactionType | TransactionType[];
    status?: TransactionStatus | TransactionStatus[];
    startDate?: Date;
    endDate?: Date;
    referenceId?: string;
  } = {}
): Promise<Transaction[]> {
  try {
    if (!userId) return [];

    const client = supabaseService.getRawClient();

    // Build query
    let query = client
      .from(getTableName.transactions())
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.type) {
      if (Array.isArray(options.type)) {
        query = query.in('transaction_type', options.type);
      } else {
        query = query.eq('transaction_type', options.type);
      }
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.referenceId) {
      query = query.eq('reference_id', options.referenceId);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    // Apply pagination
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(normalizeTransactionRecord);
  } catch (error) {
    handlePaymentError(error, 'Failed to get transaction history');
    return [];
  }
}

/**
 * Get transactions grouped by time period (day, week, month)
 * @param userId User ID
 * @param period Time period grouping
 * @param limit Maximum number of periods to return
 * @returns Grouped transactions
 */
export async function getTransactionsByPeriod(
  userId: string,
  period: 'day' | 'week' | 'month' = 'month',
  limit: number = 6
): Promise<
  Array<{
    period: string;
    total: number;
    count: number;
    transactions: Transaction[];
  }>
> {
  try {
    if (!userId) return [];

    // Get all transactions for the period
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - limit);
        break;
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - limit * 7);
        break;
      case 'month':
      default:
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - limit);
        break;
    }

    const transactions = await getTransactionHistory(userId, {
      startDate,
      endDate,
      limit: 1000, // Large limit to get all transactions in period
    });

    // Group transactions by period
    const groupedTransactions: Record<
      string,
      {
        period: string;
        total: number;
        count: number;
        transactions: Transaction[];
      }
    > = {};

    transactions.forEach(transaction => {
      let periodKey: string;
      const date = new Date(transaction.createdAt);

      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week': {
          // Get the first day of the week (Sunday)
          const day = date.getDay();
          const diff = date.getDate() - day;
          const firstDayOfWeek = new Date(date);
          firstDayOfWeek.setDate(diff);
          periodKey = firstDayOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD (first day of week)
          break;
        }
        case 'month':
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() as string + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedTransactions[periodKey]) {
        groupedTransactions[periodKey] = {
          period: periodKey,
          total: 0,
          count: 0,
          transactions: [],
        };
      }

      groupedTransactions[periodKey].transactions.push(transaction);
      groupedTransactions[periodKey].count += 1;
      groupedTransactions[periodKey].total += transaction.amount;
    });

    // Convert to array and sort by period
    return Object.values(groupedTransactions).sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    handlePaymentError(error, 'Failed to get transactions by period');
    return [];
  }
}

/**
 * Update a transaction status
 * @param transactionId Transaction ID
 * @param status New status
 * @param metadata Optional metadata updates
 * @returns Success status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    if (!transactionId) return false;

    const client = supabaseService.getRawClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await client
      .from(getTableName.transactions())
      .update(updateData)
      .eq('id', transactionId);

    if (error) throw error;

    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to update transaction status');
    return false;
  }
}

/**
 * Get transaction statistics for a user
 * @param userId User ID
 * @returns Transaction statistics
 */
export async function getTransactionStats(userId: string): Promise<{
  totalSpent: number;
  totalEarned: number;
  netAmount: number;
  transactionCount: number;
}> {
  try {
    if (!userId) {
      return {
        totalSpent: 0,
        totalEarned: 0,
        netAmount: 0,
        transactionCount: 0,
      };
    }

    const client = supabaseService.getRawClient();

    // Get all completed transactions
    const { data, error } = await client
      .from(getTableName.transactions())
      .select('amount_in_cents, transaction_type')
      .eq('user_id', userId)
      .eq('status', TransactionStatus.COMPLETED);

    if (error) throw error;

    // Calculate statistics
    let totalSpent = 0;
    let totalEarned = 0;

    (data || []).forEach(transaction => {
      const amount = transaction.amount_in_cents / 100;

      if (
        amount < 0 ||
        transaction.transaction_type === TransactionType.CREDIT_DEDUCTION ||
        transaction.transaction_type === TransactionType.PAYMENT
      ) {
        totalSpent += Math.abs(amount);
      } else {
        totalEarned += amount;
      }
    });

    return {
      totalSpent,
      totalEarned,
      netAmount: totalEarned - totalSpent,
      transactionCount: (data || []).length,
    };
  } catch (error) {
    handlePaymentError(error, 'Failed to get transaction statistics');
    return {
      totalSpent: 0,
      totalEarned: 0,
      netAmount: 0,
      transactionCount: 0,
    };
  }
}

/**
 * Get a specific transaction by ID
 * @param transactionId Transaction ID
 * @returns Transaction or null if not found
 */
export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  try {
    if (!transactionId) return null;

    const client = supabaseService.getRawClient();

    const { data, error } = await client
      .from(getTableName.transactions())
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return normalizeTransactionRecord(data);
  } catch (error) {
    handlePaymentError(error, 'Failed to get transaction');
    return null;
  }
}

/**
 * Convert a transaction record to the normalized Transaction interface
 * @param record Transaction record from database
 * @returns Normalized transaction object
 */
function normalizeTransactionRecord(record: TransactionRecord): Transaction {
  return {
    id: record.id || '',
    userId: record.user_id,
    amount: record.amount_in_cents / 100,
    description: record.description,
    type: record.transaction_type as TransactionType,
    status: record.status as TransactionStatus,
    referenceId: record.reference_id,
    createdAt: new Date(record.created_at),
    updatedAt: record.updated_at ? new Date(record.updated_at) : undefined,
    metadata: record.metadata as Record<string, unknown> | undefined,
  };
}
