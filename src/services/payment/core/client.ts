/**
 * @file Unified client for Supabase and Stripe
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Database } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

// Cache the clients to prevent multiple initializations
let stripeClientInstance: Stripe | null = null;
let supabaseAdminClientInstance: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Supabase service for payment operations
 */
export const supabaseService = {
  /**
   * Get the raw Supabase client for direct database operations
   * Uses the browser client with auth context when available
   */
  getRawClient() {
    return supabase;
  },

  /**
   * Get the admin client for server-side operations
   * This should only be used in Edge Functions or server-side code
   */
  getAdminClient() {
    if (typeof window !== 'undefined') {
      throw new Error('Admin client cannot be used in browser context');
    }

    if (!supabaseAdminClientInstance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_U as string;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_K as string;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }

      supabaseAdminClientInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
        },
      });
    }

    return supabaseAdminClientInstance;
  },
};

/**
 * Stripe service for payment processing
 */
export const stripeService = {
  /**
   * Get the Stripe client for payment operations
   * @param isServer Whether this is being called from server-side code
   */
  getClient(isServer = false): Stripe {
    if (!stripeClientInstance) {
      // In browser context, we use the public key
      if (!isServer && typeof window !== 'undefined') {
        const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_K as string;
        if (!publicKey) {
          throw new Error('Missing Stripe publishable key');
        }

        stripeClientInstance = new Stripe(publicKey);
      } else {
        // In server context, use the secret key
        const secretKey = process.env.STRIPE_SECRET_K as string;
        if (!secretKey) {
          throw new Error('Missing Stripe secret key');
        }

        stripeClientInstance = new Stripe(secretKey, {
          apiVersion: '2023-10-16', // Use explicit API version
        });
      }
    }

    return stripeClientInstance;
  },

  /**
   * Reset the client instance (useful for testing)
   */
  resetClient() {
    stripeClientInstance = null;
  },
};

/**
 * Get database table names based on environment
 */
export const getTableName = {
  wallets() {
    return process.env.NODE_ENV as string === 'production' ? 'wallets' : 'wallets';
  },

  transactions() {
    return process.env.NODE_ENV as string === 'production' ? 'transactions' : 'transactions';
  },

  payments() {
    return process.env.NODE_ENV as string === 'production' ? 'payments' : 'PaymentsTest';
  },

  creditTransactions() {
    return process.env.NODE_ENV as string === 'production' ? 'credit_transactions' : 'credit_transactions';
  },
};
