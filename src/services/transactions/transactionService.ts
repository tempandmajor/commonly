import { supabase } from '@/integrations/supabase/client';
import { COLLECTIONS } from '@/lib/constants';
import { captureException, addBreadcrumb } from '@/config/sentry';
import { z } from 'zod';
import { TransactionStatusSchema, AmountInCentsSchema } from '@/lib/validation/payment';

/**
 * Database transaction schema (from PaymentsTest table)
 */
const DbTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount_in_cents: AmountInCentsSchema,
  description: z.string().nullable().optional(),
  status: TransactionStatusSchema,
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});

/**
 * Public transaction interface
 */
export interface Transaction {
  id: string;
  event: string;
  date: string;
  attendees: number;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

const PAYMENTS_TABLE =
  process.env.NODE_ENV as string === 'production' ? COLLECTIONS.PAYMENTS || 'payments' : 'PaymentsTest';
const MAX_RETRIES = 2;

/**
 * Convert database transaction to public Transaction interface
 */
function mapDbTransactionToTransaction(dbTransaction: z.infer<typeof DbTransactionSchema>): Transaction {
  return {
    id: dbTransaction.id,
    event: dbTransaction.description || 'Unnamed Event',
    date: dbTransaction.created_at,
    attendees: 0, // PaymentsTest table doesn't have attendees field
    amount: dbTransaction.amount_in_cents / 100, // Convert cents to dollars
    status: dbTransaction.status as 'completed' | 'pending' | 'failed',
  };
}

/**
 * Get recent transactions for a user
 * @param userId The user ID
 * @param limitCount Optional number of transactions to return (default: 5)
 * @returns Array of transactions
 */
export const getRecentTransactions = async (
  userId: string,
  limitCount: number = 5
): Promise<Transaction[]> => {
  // Validate inputs
  const uuidSchema = z.string().uuid();
  const limitSchema = z.number().int().positive().max(100);

  const userIdValidation = uuidSchema.safeParse(userId);
  const limitValidation = limitSchema.safeParse(limitCount);

  if (!userIdValidation.success) {
    const error = new Error('Invalid user ID format');
    captureException(error, { context: 'getRecentTransactions', userId });
    return [];
  }

  if (!limitValidation.success) {
    const error = new Error('Invalid limit value');
    captureException(error, { context: 'getRecentTransactions', limitCount });
    return [];
  }

  let retries = 0;

  const fetchWithRetry = async (): Promise<Transaction[]> => {
    try {
      addBreadcrumb('Fetching recent transactions', { userId, limitCount });

      const { data: transactions, error } = await supabase
        .from('PaymentsTest')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      // Validate and parse transactions
      const validatedTransactions = (transactions || [])
        .map((transaction) => {
          try {
            const validated = DbTransactionSchema.parse(transaction);
            return mapDbTransactionToTransaction(validated);
          } catch (parseError) {
            captureException(parseError as Error, {
              context: 'getRecentTransactions - parsing transaction',
              transaction,
            });
            return null;
          }
        })
        .filter((t): t is Transaction => t !== null);

      return validatedTransactions;
    } catch (error) {
      // Log error to Sentry with context
      captureException(error as Error, {
        context: 'getRecentTransactions',
        userId,
        table: PAYMENTS_TABLE,
        retry: retries,
      });

      // If we haven't exceeded max retries, try again
      if (retries < MAX_RETRIES) {
        retries++;
        // Exponential backoff
        const delay = 300 * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry();
      }

      // If we've exceeded max retries, return an empty array
      return [];
    }
  };

  return fetchWithRetry();
};

/**
 * Get transactions for a specific date range
 * @param userId The user ID
 * @param startDate Start of date range
 * @param endDate End of date range
 * @returns Array of transactions
 */
export const getTransactionsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> => {
  // Validate inputs
  const uuidSchema = z.string().uuid();
  const dateSchema = z.date();

  const userIdValidation = uuidSchema.safeParse(userId);
  const startDateValidation = dateSchema.safeParse(startDate);
  const endDateValidation = dateSchema.safeParse(endDate);

  if (!userIdValidation.success) {
    const error = new Error('Invalid user ID format');
    captureException(error, { context: 'getTransactionsByDateRange', userId });
    return [];
  }

  if (!startDateValidation.success || !endDateValidation.success) {
    const error = new Error('Invalid date format');
    captureException(error, { context: 'getTransactionsByDateRange', startDate, endDate });
    return [];
  }

  if (startDate > endDate) {
    const error = new Error('Start date must be before end date');
    captureException(error, { context: 'getTransactionsByDateRange', startDate, endDate });
    return [];
  }

  try {
    addBreadcrumb('Fetching transactions by date range', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const { data: transactions, error } = await supabase
      .from('PaymentsTest')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Validate and parse transactions
    const validatedTransactions = (transactions || [])
      .map((transaction) => {
        try {
          const validated = DbTransactionSchema.parse(transaction);
          return mapDbTransactionToTransaction(validated);
        } catch (parseError) {
          captureException(parseError as Error, {
            context: 'getTransactionsByDateRange - parsing transaction',
            transaction,
          });
          return null;
        }
      })
      .filter((t): t is Transaction => t !== null);

    return validatedTransactions;
  } catch (error) {
    // Log error to Sentry with context
    captureException(error as Error, {
      context: 'getTransactionsByDateRange',
      userId,
      table: PAYMENTS_TABLE,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return [];
  }
};
