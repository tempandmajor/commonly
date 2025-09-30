import { Database } from './types';

/**
 * Extension of the Supabase database types to include tables that are not yet included
 * in the generated types.
 */

// Define the shape of the extended database schema
type ExtendedDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      webhook_logs: {
        Row: {
          id: string;
          provider: string;
          event_type: string;
          payload: unknown;
          status: 'received' | 'processed' | 'failed';
          created_at: string;
          processed_at?: string | null;
          error_message?: string | null;
        };
        Insert: {
          id?: string;
          provider: string;
          event_type: string;
          payload: unknown;
          status: 'received' | 'processed' | 'failed';
          created_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          provider?: string;
          event_type?: string;
          payload?: unknown;
          status?: 'received' | 'processed' | 'failed';
          created_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount_in_cents: number;
          status: 'pending' | 'completed' | 'failed';
          transaction_id?: string | null;
          created_at: string;
          updated_at?: string | null;
          error_message?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_in_cents: number;
          status?: 'pending' | 'completed' | 'failed';
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_in_cents?: number;
          status?: 'pending' | 'completed' | 'failed';
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'withdrawals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          status: 'pending' | 'completed';
          bonus_amount_in_cents?: number | null;
          created_at: string;
          completed_at?: string | null;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          status?: 'pending' | 'completed';
          bonus_amount_in_cents?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string;
          status?: 'pending' | 'completed';
          bonus_amount_in_cents?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referrals_referred_id_fkey';
            columns: ['referred_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          transaction_type: 'deposit' | 'withdrawal' | 'referral' | 'adjustment';
          reference_id?: string | null;
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
          updated_at?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          transaction_type: 'deposit' | 'withdrawal' | 'referral' | 'adjustment';
          reference_id?: string | null;
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          transaction_type?: 'deposit' | 'withdrawal' | 'referral' | 'adjustment';
          reference_id?: string | null;
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: 'wallet_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      security_logs: {
        Row: {
          id: string;
          user_id: string;
          type: 'fraud_detection' | 'security_alert' | 'account_access';
          details: unknown;
          created_at: string;
          severity?: 'low' | 'medium' | 'high' | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'fraud_detection' | 'security_alert' | 'account_access';
          details: unknown;
          created_at?: string;
          severity?: 'low' | 'medium' | 'high' | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'fraud_detection' | 'security_alert' | 'account_access';
          details?: unknown;
          created_at?: string;
          severity?: 'low' | 'medium' | 'high' | null;
        };
        Relationships: [
          {
            foreignKeyName: 'security_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      // Add additional fields to the wallets table
      wallets: Database['public']['Tables']['wallets'] & {
        Row: Database['public']['Tables']['wallets']['Row'] & {
          available: number;
          available_balance_in_cents: number;
          pending_balance_in_cents: number;
          referral_earnings: number;
        };
        Insert: Database['public']['Tables']['wallets']['Insert'] & {
          available?: number;
          available_balance_in_cents?: number;
          pending_balance_in_cents?: number;
          referral_earnings?: number;
        };
        Update: Database['public']['Tables']['wallets']['Update'] & {
          available?: number;
          available_balance_in_cents?: number;
          pending_balance_in_cents?: number;
          referral_earnings?: number;
        };
      };
      // Add analytics fields to the products table
      products: Database['public']['Tables']['products'] & {
        Row: Database['public']['Tables']['products']['Row'] & {
          views: number;
          cart_adds: number;
          purchases: number;
          units_sold: number;
          revenue: number;
          shares: number;
          last_viewed_at?: string | null;
          last_cart_add_at?: string | null;
          last_purchased_at?: string | null;
          last_shared_at?: string | null;
        };
        Insert: Database['public']['Tables']['products']['Insert'] & {
          views?: number;
          cart_adds?: number;
          purchases?: number;
          units_sold?: number;
          revenue?: number;
          shares?: number;
          last_viewed_at?: string | null;
          last_cart_add_at?: string | null;
          last_purchased_at?: string | null;
          last_shared_at?: string | null;
        };
        Update: Database['public']['Tables']['products']['Update'] & {
          views?: number;
          cart_adds?: number;
          purchases?: number;
          units_sold?: number;
          revenue?: number;
          shares?: number;
          last_viewed_at?: string | null;
          last_cart_add_at?: string | null;
          last_purchased_at?: string | null;
          last_shared_at?: string | null;
        };
      };
      // Add product analytics related tables
      user_product_interactions: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          action_type: 'view' | 'cart_add' | 'purchase' | 'share';
          quantity?: number | null;
          amount?: number | null;
          created_at: string;
          metadata?: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          action_type: 'view' | 'cart_add' | 'purchase' | 'share';
          quantity?: number | null;
          amount?: number | null;
          created_at?: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          action_type?: 'view' | 'cart_add' | 'purchase' | 'share';
          quantity?: number | null;
          amount?: number | null;
          created_at?: string;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_product_interactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_product_interactions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_shares: {
        Row: {
          id: string;
          product_id: string;
          platform: string;
          user_id?: string | null;
          created_at: string;
          success: boolean;
          metadata?: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          platform: string;
          user_id?: string | null;
          created_at?: string;
          success?: boolean;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          platform?: string;
          user_id?: string | null;
          created_at?: string;
          success?: boolean;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_shares_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_shares_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
  };
};

// Export the augmented type
export type { ExtendedDatabase };
