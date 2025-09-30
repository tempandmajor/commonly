import { SearchFilters, SearchResult, SearchOptions } from '../types';
import { searchCache } from '../cache';
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  user_id: string | null;
  type: 'credit' | 'debit' | 'refund' | 'withdrawal' | 'deposit' | 'payment' | 'transfer';
  amount_cents: number;
  amount: number; // amount in dollars for display
  description: string;
  status: string;
  reference_id?: string | undefined| null;
  reference_type?: string | undefined| null;
  metadata: Record<string, any>;
  created_at: string | null;
  updated_at?: string | undefined| null;
  source: 'wallet' | 'payment' | 'general';
}

// Extended filters for transaction search
interface TransactionFilters extends SearchFilters {
  user_id?: string;
  type?: string;
  amount_min?: number;
  amount_max?: number;
  start_date?: string;
  end_date?: string;
}

export const searchTransactions = async (
  query: string,
  filters?: TransactionFilters,
  options?: SearchOptions
): Promise<SearchResult<Transaction>> => {
  const cacheKey = `transactions:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

  // Check cache first
  const cached = searchCache.get<SearchResult<Transaction>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const transactions: Transaction[] = [];
    let totalCount = 0;

    // Search wallet transactions
    const walletQuery = supabase.from('wallet_transactions').select('*', { count: 'exact' });

    // Search general transactions
    const generalQuery = supabase.from('transactions').select('*', { count: 'exact' });

    // Add search filters for wallet transactions
    if (query.trim()) {
      walletQuery.or(`description.ilike.%${query}%,reference_id.ilike.%${query}%`);
    }

    // Add user filter if specified
    if (filters?.user_id) {
      walletQuery.eq('user_id', filters.user_id);
    }

    // Add type filter if specified
    if (filters?.type) {
      walletQuery.eq('type', filters.type);
    }

    // Add amount range filter - use existing priceRange or custom amount filters
    const minAmount = filters?.amount_min || filters?.priceRange?.min;
    const maxAmount = filters?.amount_max || filters?.priceRange?.max;

    if (minAmount) {
      walletQuery.gte('amount_cents', minAmount * 100);
    }
    if (maxAmount) {
      walletQuery.lte('amount_cents', maxAmount * 100);
    }

    // Add date range filter - use existing dateRange or custom date filters
    const startDate = filters?.start_date || filters?.dateRange?.start?.toISOString();
    const endDate = filters?.end_date || filters?.dateRange?.end?.toISOString();

    if (startDate) {
      walletQuery.gte('created_at', startDate);
    }
    if (endDate) {
      walletQuery.lte('created_at', endDate);
    }

    // Add search filters for general transactions
    if (query.trim()) {
      generalQuery.or(`description.ilike.%${query}%,metadata->>reference_id.ilike.%${query}%`);
    }

    if (filters?.user_id) {
      generalQuery.eq('user_id', filters.user_id);
    }

    if (filters?.type) {
      generalQuery.eq('transaction_type', filters.type);
    }

    if (minAmount) {
      generalQuery.gte('amount_in_cents', minAmount * 100);
    }
    if (maxAmount) {
      generalQuery.lte('amount_in_cents', maxAmount * 100);
    }

    if (startDate) {
      generalQuery.gte('created_at', startDate);
    }
    if (endDate) {
      generalQuery.lte('created_at', endDate);
    }

    // Execute both queries
    const [walletResult, generalResult] = await Promise.all([
      walletQuery.order('created_at', { ascending: false }).then(result => result),
      generalQuery.order('created_at', { ascending: false }).then(result => result),
    ]);

    // Process wallet transactions
    if (walletResult.data) {
      const walletTransactions: Transaction[] = (walletResult.data as any).map((wt: any) => ({
        id: wt.id,
        user_id: wt.user_id,
        type: wt.type as Transaction['type'],
        amount_cents: wt.amount_cents,
        amount: wt.amount_cents / 100,
        description: wt.description || 'Wallet transaction',
        status: 'completed', // wallet transactions are always completed
        reference_id: wt.reference_id,
        reference_type: wt.reference_type,
        metadata:
          typeof wt.metadata === 'object' && wt.metadata !== null
            ? (wt.metadata as Record<string, any>)
            : {},
        created_at: wt.created_at,
        source: 'wallet',
      }));
      transactions.push(...walletTransactions);
      totalCount += walletResult.count || 0;
    }

    // Process general transactions
    if (generalResult.data) {
      const generalTransactions: Transaction[] = (generalResult.data as any).map((gt: any) => {
        const metadata =
          typeof gt.metadata === 'object' && gt.metadata !== null
            ? (gt.metadata as Record<string, any>)
            : {};
        return {
          id: gt.id,
          user_id: gt.user_id,
          type: gt.transaction_type === 'payment' ? 'payment' : 'transfer',
          amount_cents: gt.amount_in_cents,
          amount: gt.amount_in_cents / 100,
          description: gt.description || 'Transaction',
          status: gt.status,
          reference_id: metadata.reference_id || null,
          reference_type: 'transaction',
          metadata: metadata,
          created_at: gt.created_at,
          updated_at: gt.updated_at,
          source: 'general',
        };
      });
      transactions.push(...generalTransactions);
      totalCount += generalResult.count || 0;
    }

    // Sort combined results by date (newest first)
    transactions.sort(
      (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );

    // Apply pagination to combined results
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    const result: SearchResult<Transaction> = {
      items: paginatedTransactions,
      total: totalCount,
      hasMore: totalCount > offset + limit,
    };

    // Cache the result for 5 minutes (transactions change frequently)
    searchCache.set(cacheKey, result, 300);

    return result;
  } catch (error) {
    console.error('Error in transaction search:', error);
    return {
      items: [],
      total: 0,
      hasMore: false,
    };
  }
};
