import { supabase } from '@/integrations/supabase/client';

export interface Release {
  id: string;
  title: string;
  artist: string;
  album: string;
  releaseDate: string;
  imageUrl?: string | undefined;
  coverImage?: string | undefined;
  type?: string | undefined;
  genre?: string | undefined;
  streamingLinks?: {
    spotify?: string | undefined;
    apple?: string | undefined;
    youtube?: string | undefined;
  };
}

export const getLatestReleases = async (limit: number = 10): Promise<Release[]> => {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      releaseDate: item.release_date,
      imageUrl: item.image_url,
      coverImage: item.cover_image || item.image_url,
      type: item.type || 'Single',
      genre: item.genre || 'Unknown',
      streamingLinks: item.streaming_links,
    }));
  } catch (error) {
    console.error('Error fetching releases:', error);
    return [];
  }
};

export const fetchReleases = async (filter: string = 'all'): Promise<Release[]> => {
  try {
    let query = supabase
      .from('ContentTest')
      .select('*')
      .like('body', '%"type":"release"%')
      .order('created_at', { ascending: false });

    if (filter !== 'all' && filter !== 'All') {
      query = query.like('body', `%"genre":"${filter}"%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (
      (data || [])
        .map(item => {
          try {
            const releaseData = JSON.parse(item.body || '{}') as any;
            if (releaseData.type === 'release') {
              return {
                id: item.id,
                title: item.title || releaseData.title,
                artist: releaseData.artist || '',
                album: releaseData.album || '',
                releaseDate: releaseData.releaseDate || item.created_at,
                imageUrl: releaseData.imageUrl,
                coverImage: releaseData.coverImage || releaseData.imageUrl,
                type: releaseData.releaseType || 'Single',
                genre: releaseData.genre || 'Unknown',
                streamingLinks: releaseData.streamingLinks,
              } as Release;
            }
          } catch {
            // Skip invalid JSON
          }
          return null;
        })
        .filter(Boolean) || []
    );
  } catch (error) {
    return [];
  }
};

export const fetchGenres = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('ContentTest')
      .select('body')
      .like('body', '%"type":"release"%');

    if (error) throw error;

    const genres = new Set<string>();

    (data || []).forEach(item => {
      try {
        const releaseData = JSON.parse(item.body || '{}') as any;
        if (releaseData.type === 'release' && releaseData.genre) {
          genres.add(releaseData.genre);
        }
      } catch {
        // Skip invalid JSON
      }
    });

    return Array.from(genres);
  } catch (error) {
    return [];
  }
};

export const createRelease = async (releaseData: Omit<Release, 'id'>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('ContentTest')
      .insert({
        title: releaseData.title,
        body: JSON.stringify({
          type: 'release',
          ...releaseData,
          createdAt: new Date().toISOString(),
        }),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    return null;
  }
};
