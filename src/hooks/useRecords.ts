import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Artist {
  id: string;
  name: string;
  bio?: string | undefined;
  imageUrl?: string | undefined;
  createdAt: string;
}

interface Album {
  id: string;
  title: string;
  artistId: string;
  releaseDate: string;
  imageUrl?: string | undefined;
  createdAt: string;
}

export const useRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);

        // Fetch real artists from Supabase
        const { data: artistsData, error: artistsError } = await supabase
          .from('artists')
          .select('*')
          .order('created_at', { ascending: false });

        if (artistsError) throw artistsError;

        setArtists(artistsData || []);

        // For now, set records based on artists until we have a records table
        const recordsData = (artistsData || []).map(artist => ({
          id: artist.id,
          type: 'artist',
          title: artist.stage_name,
          data: {
            followers: artist.followers_count || 0,
            monthly_listeners: artist.monthly_listeners || 0,
            verified: artist.verified,
          },
          createdAt: artist.created_at,
        }));

        setRecords(recordsData);
        setAlbums([]); // TODO: Implement albums table
        setError(null);
      } catch (err) {
        setError('Failed to load records');
        toast.error('Failed to load records');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const addArtist = async (artistData: Omit<Artist, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .insert({
          stage_name: artistData.name,
          bio: artistData.bio,
          image_url: artistData.imageUrl,
          user_id: null, // TODO: Connect to current user when auth is implemented
        })
        .select()
        .single();

      if (error) throw error;

      const newArtist: Artist = {
        id: data.id,
        name: data.stage_name,
        bio: data.bio,
        imageUrl: data.image_url,
        createdAt: data.created_at,
      };

      setArtists(prev => [...prev, newArtist]);
      toast.success('Artist added successfully');
      return true;
    } catch (err) {
      toast.error('Failed to add artist');
      return false;
    }
  };

  const updateArtist = async (id: string, updates: Partial<Artist>) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .update({
          stage_name: updates.name,
          bio: updates.bio,
          image_url: updates.imageUrl,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setArtists(prev =>
        prev.map(artist =>
          artist.id === id
            ? {
          ...artist,
                name: data.stage_name,
                bio: data.bio,
                imageUrl: data.image_url,
              }
            : artist
        )
      );
      toast.success('Artist updated successfully');
      return true;
    } catch (err) {
      toast.error('Failed to update artist');
      return false;
    }
  };

  const deleteArtist = async (id: string) => {
    try {
      const { error } = await supabase.from('artists').delete().eq('id', id);

      if (error) throw error;

      setArtists(prev => prev.filter(artist => artist.id !== id));
      toast.success('Artist deleted successfully');
      return true;
    } catch (err) {
      toast.error('Failed to delete artist');
      return false;
    }
  };

  const addAlbum = async (albumData: Omit<Album, 'id' | 'createdAt'>) => {
    try {
      const newAlbum: Album = {
          ...albumData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setAlbums(prev => [...prev, newAlbum]);
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateAlbum = async (id: string, updates: Partial<Album>) => {
    try {
      setAlbums(prev => prev.map(album => (album.id === id ? { ...album, ...updates } : album)));
      return true;
    } catch (err) {
      return false;
    }
  };

  const deleteAlbum = async (id: string) => {
    try {
      setAlbums(prev => prev.filter(album => album.id !== id));
      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    records,
    artists,
    albums,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    error,
    addArtist,
    updateArtist,
    deleteArtist,
    addAlbum,
    updateAlbum,
    deleteAlbum,
    refetch: () => {}, // Mock refetch function
  };
};
