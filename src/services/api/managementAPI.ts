/**
 * Management API
 * Provides functions to fetch management dashboard data from the backend.
 *
 * @deprecated This file is deprecated. Import from '@/services/api/management' instead.
 */

import { supabase } from '@/integrations/supabase/client';

export async function getManagementData(): Promise<any> {
  const { data, error } = await supabase.from('management_dashboard').select('*');
  if (error) throw error;
  return data;
}
