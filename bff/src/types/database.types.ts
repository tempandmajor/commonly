export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      idempotency_keys: {
        Row: {
          key: string
          created_at: string
          expires_at: string
          response: Json | null
          status_code: number | null
        }
        Insert: {
          key: string
          created_at?: string
          expires_at?: string
          response?: Json | null
          status_code?: number | null
        }
        Update: Partial<Database['public']['Tables']['idempotency_keys']['Insert']>
        Relationships: []
      }
      outbox_events: {
        Row: {
          id: string
          event_type: string
          payload: Json
          created_at: string
          processed_at: string | null
          attempts?: number | null
          next_attempt_at?: string | null
        }
        Insert: Omit<Database['public']['Tables']['outbox_events']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['outbox_events']['Row']>
        Relationships: []
      }
      outbox_dead_letter: {
        Row: {
          id: string
          original_event_id: string
          event_type: string
          payload: Json
          attempt: number
          error: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['outbox_dead_letter']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['outbox_dead_letter']['Row']>
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          type: string
          payload: Json
          created_at: string
          processed_at: string | null
        }
        Insert: Database['public']['Tables']['stripe_events']['Row']
        Update: Partial<Database['public']['Tables']['stripe_events']['Row']>
        Relationships: []
      }
      ledger_transactions: {
        Row: {
          id: string
          reference: Json | null
          created_at: string
        }
        Insert: { id?: string; reference?: Json | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['ledger_transactions']['Row']>
        Relationships: []
      }
      ledger_entries: {
        Row: {
          id: string
          transaction_id: string
          account_id: string
          amount_cents: number
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ledger_entries']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['ledger_entries']['Row']>
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          bool_value: boolean | null
          json_value: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['platform_settings']['Row']> & { key: string }
        Update: Partial<Database['public']['Tables']['platform_settings']['Row']>
        Relationships: []
      }
      creator_waitlist: {
        Row: {
          id: string
          user_id: string | null
          email: string
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['creator_waitlist']['Row']> & { email: string }
        Update: Partial<Database['public']['Tables']['creator_waitlist']['Row']>
        Relationships: []
      }
      creator_invites: {
        Row: {
          id: string
          inviter_user_id: string
          invitee_email: string
          token: string
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          expires_at: string | null
          created_at: string
          accepted_user_id: string | null
          accepted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['creator_invites']['Row']> & { inviter_user_id: string; invitee_email: string; token: string }
        Update: Partial<Database['public']['Tables']['creator_invites']['Row']>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string | null
          is_admin: boolean | null
          can_create_events: boolean | null
        }
        Insert: never
        Update: Partial<Database['public']['Tables']['users']['Row']>
        Relationships: []
      }
    }
    Views: { [key: string]: never }
    Functions: { [key: string]: never }
    Enums: { [key: string]: never }
    CompositeTypes: { [key: string]: never }
  }
} 