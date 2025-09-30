/**
 * Shared Supabase client for profile service
 *
 * This file provides a shared Supabase client instance to be used across the profile service.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Shared Supabase client instance
 */
export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);
