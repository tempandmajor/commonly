import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { captureException, addBreadcrumb } from '@/config/sentry';
import { AmountInCentsSchema } from '@/lib/validation/payment';

/**
 * Wallet balance schema
 */
const WalletBalanceSchema = z.object({
  available_balance_in_cents: AmountInCentsSchema.nullable().default(0),
  pending_balance_in_cents: AmountInCentsSchema.nullable().default(0),
});

export type WalletBalance = {
  available: number;
  pending: number;
};

/**
 * Get user's wallet balance
 */
export const getWalletBalance = async (userId: string): Promise<WalletBalance> => {
  // Validate userId is a valid UUID
  const uuidSchema = z.string().uuid();
  const validationResult = uuidSchema.safeParse(userId);

  if (!validationResult.success) {
    const error = new Error('Invalid user ID format');
    captureException(error, { context: 'getWalletBalance', userId });
    toast.error('Invalid user ID');
    return { available: 0, pending: 0 };
  }

  try {
    addBreadcrumb('Fetching wallet balance', { userId });

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('available_balance_in_cents, pending_balance_in_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (wallet) {
      // Validate wallet data
      const validated = WalletBalanceSchema.parse(wallet);
      return {
        available: validated.available_balance_in_cents ?? 0,
        pending: validated.pending_balance_in_cents ?? 0,
      };
    }

    // If wallet doesn't exist, return zero balance
    return {
      available: 0,
      pending: 0,
    };
  } catch (error) {
    captureException(error as Error, {
      context: 'getWalletBalance',
      userId,
    });

    if (error instanceof Error) {
      toast.error(`Failed to retrieve wallet balance: ${error.message}`);
    } else {
      toast.error('Failed to retrieve wallet balance');
    }

    // Return zero balance as fallback
    return {
      available: 0,
      pending: 0,
    };
  }
};

/**
 * Wallet transaction schema
 */
const WalletTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount_in_cents: z.number().int(),
  type: z.enum(['credit', 'debit']),
  status: z.enum(['pending', 'completed', 'failed']),
  description: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});

export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

/**
 * Get user's wallet transactions
 */
export const getWalletTransactions = async (
  userId: string,
  limit = 50
): Promise<WalletTransaction[]> => {
  // Validate inputs
  const uuidSchema = z.string().uuid();
  const limitSchema = z.number().int().positive().max(100);

  const userIdValidation = uuidSchema.safeParse(userId);
  const limitValidation = limitSchema.safeParse(limit);

  if (!userIdValidation.success) {
    const error = new Error('Invalid user ID format');
    captureException(error, { context: 'getWalletTransactions', userId });
    toast.error('Invalid user ID');
    return [];
  }

  if (!limitValidation.success) {
    const error = new Error('Invalid limit value');
    captureException(error, { context: 'getWalletTransactions', limit });
    toast.error('Invalid limit value');
    return [];
  }

  try {
    addBreadcrumb('Fetching wallet transactions', { userId, limit });

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Validate and parse transactions
    const transactions = (data || []).map((transaction) => {
      try {
        return WalletTransactionSchema.parse(transaction);
      } catch (parseError) {
        captureException(parseError as Error, {
          context: 'getWalletTransactions - parsing transaction',
          transaction,
        });
        return null;
      }
    }).filter((t): t is WalletTransaction => t !== null);

    return transactions;
  } catch (error) {
    captureException(error as Error, {
      context: 'getWalletTransactions',
      userId,
      limit,
    });

    if (error instanceof Error) {
      toast.error(`Failed to retrieve wallet transactions: ${error.message}`);
    } else {
      toast.error('Failed to retrieve wallet transactions');
    }
    return [];
  }
};
