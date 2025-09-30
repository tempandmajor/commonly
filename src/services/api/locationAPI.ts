/**
 * Location API
 * Provides functions to fetch and save user/location data.
 *
 * @deprecated This file is deprecated. Import from '@/services/api/location' instead.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch events near a given location (latitude, longitude).
 * Uses a Postgres RPC function 'get_events_near_location'.
 */
export async function fetchEventsNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 25
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_events_near_location', {
    lat,
    lng,
    radius_km: radiusKm,
  });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch popular locations from the backend.
 */
export async function fetchPopularLocations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('name')
    .order('use_count', { ascending: false })
    .limit(5);
  if (error) throw error;
  return (
    data
      ?.map((loc: { name: string | null }) => loc.name)
      .filter((name): name is string => typeof name === 'string') || []
  );
}

/**
 * Save a user's location to the backend.
 */
export async function saveUserLocation(userId: string, location: string): Promise<void> {
  const { error } = await supabase.from('user_locations').insert([{ user_id: userId, location }]);
  if (error) throw error;
}
