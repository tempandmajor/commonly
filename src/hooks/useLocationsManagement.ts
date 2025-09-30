import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

export interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export const useLocationsManagement = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLocations(data || []);
    } catch (err) {
      setError('Failed to fetch locations');
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLocation = useCallback(async (locationData: LocationFormData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('locations')
        .insert({
          ...locationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      setLocations(prev => [data, ...prev]);
      toast.success('Location created successfully');
      return data;
    } catch (err) {
      setError('Failed to create location');
      toast.error('Failed to create location');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocation = useCallback(
    async (id: string, locationData: Partial<LocationFormData>) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await supabase
          .from('locations')
          .update({
          ...locationData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        setLocations(prev => prev.map(loc => (loc.id === id ? data : loc)));
        toast.success('Location updated successfully');
        return data;
      } catch (err) {
        setError('Failed to update location');
        toast.error('Failed to update location');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteLocation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase.from('locations').delete().eq('id', id);

      if (deleteError) throw deleteError;

      setLocations(prev => prev.filter(loc => loc.id !== id));
      toast.success('Location deleted successfully');
    } catch (err) {
      setError('Failed to delete location');
      toast.error('Failed to delete location');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    locations,
    loading,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};
