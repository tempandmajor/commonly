import { supabase } from '@/integrations/supabase/client';

export interface Venue {
  id: string;
  name: string;
  description?: string | undefined;
  address?: string | undefined;
  capacity?: number | undefined;
  amenities?: string[] | undefined;
  owner_id?: string | undefined;
  location_id?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/**
 * Get all venues with optional filtering
 */
export const getVenues = async (filters?: {
  city?: string;
  capacity?: number;
  amenities?: string[];
}): Promise<Venue[]> => {
  try {
    let query = supabase.from('venues').select(`
        *,
        locations (
          address,
          city,
          state,
          country
        )
      `);

    if (filters?.capacity) {
      query = query.gte('capacity', filters.capacity);
    }

    if (filters?.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((venue: any) => ({
      id: venue.id,
      name: venue.name || '',
      description: venue.description,
      address: venue.locations?.address,
      capacity: venue.capacity,
      amenities: Array.isArray(venue.amenities) ? venue.amenities.map(String) : [],
      owner_id: venue.owner_id,
      location_id: venue.location_id,
      created_at: venue.created_at,
      updated_at: venue.updated_at,
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Get a single venue by ID
 */
export const getVenueById = async (id: string): Promise<Venue | null> => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select(
        `
        *,
        locations (
          address,
          city,
          state,
          country
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    const typedData = data as any;
    return {
      id: typedData.id,
      name: typedData.name || '',
      description: typedData.description,
      address: typedData.locations?.address,
      capacity: typedData.capacity,
      amenities: Array.isArray(typedData.amenities) ? typedData.amenities.map(String) : [],
      owner_id: typedData.owner_id,
      location_id: typedData.location_id,
      created_at: typedData.created_at,
      updated_at: typedData.updated_at,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Create a new venue
 */
export const createVenue = async (
  venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>
): Promise<Venue | null> => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: venue.name,
        description: venue.description,
        capacity: venue.capacity,
        amenities: venue.amenities || [],
        owner_id: venue.owner_id,
        location_id: venue.location_id,
      })
      .select()
      .single();

    if (error) throw error;

    const typedData = data as any;
    return {
      id: typedData.id,
      name: typedData.name,
      description: typedData.description,
      capacity: typedData.capacity,
      amenities: Array.isArray(typedData.amenities) ? typedData.amenities.map(String) : [],
      owner_id: typedData.owner_id,
      location_id: typedData.location_id,
      created_at: typedData.created_at,
      updated_at: typedData.updated_at,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Get featured venues (example implementation)
 */
export const getFeaturedVenues = async (limit: number = 6): Promise<Venue[]> => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select(
        `
        *,
        locations (
          address,
          city,
          state,
          country
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((venue: any) => ({
      id: venue.id,
      name: venue.name || '',
      description: venue.description,
      address: venue.locations?.address,
      capacity: venue.capacity,
      amenities: Array.isArray(venue.amenities) ? venue.amenities.map(String) : [],
      owner_id: venue.owner_id,
      location_id: venue.location_id,
      created_at: venue.created_at,
      updated_at: venue.updated_at,
    }));
  } catch (error) {
    return [];
  }
};
