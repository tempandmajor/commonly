export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DatabasePublic = {
  Tables: Record<string, unknown>
  Views: Record<string, unknown>
  Functions: Record<string, unknown>
  Enums: Record<string, unknown>
  CompositeTypes: Record<string, unknown>
}

export type Database = {
  public: DatabasePublic
}

export type PaymentMethod = {
  id: string
  type: string
  card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number }
  billing_details?: { name?: string; email?: string }
  is_default?: boolean
} 