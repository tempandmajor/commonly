import { supabase } from '@/integrations/supabase/client';
// Using built-in toast or alternative notification instead of sonner to reduce dependencies

export const deleteMedia = async (url: string): Promise<boolean> => {
  try {
    // Extract path from URL if it's a public URL
    let path = url;

    // Handle Supabase URLs
    if (url.includes('/storage/v1/object/public/files/')) {
      path = url.split('/storage/v1/object/public/files/').pop() || url;
    } else if (url.includes('/storage/')) {
      path = url.split('/storage/').pop() || url;
    }

    // Delete the main file
    const { error } = await supabase.storage.from('files').remove([path]);

    if (error) {
      throw error;
    }

    // Try to delete thumbnail if it exists
    try {
      const urlParts = path.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const basePath = urlParts.slice(0, -1).join('/');
      const thumbnailPath = `${basePath}/thumbnails/${fileName}`;

      const { error: thumbnailError } = await supabase.storage
        .from('files')
        .remove([thumbnailPath]);

      // If thumbnail doesn't exist, continue silently
      if (thumbnailError && thumbnailError.message?.includes('not found')) {
        // Thumbnail might not exist, continue silently
      } else if (thumbnailError) {
      }
    } catch (error) {
      // Thumbnail might not exist, continue silently
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const listMedia = async (path: string): Promise<{ name: string; url: string }[]> => {
  try {
    const { data, error } = await supabase.storage.from('files').list(path, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw error;
    }

    // Map the results to the expected format
    const mediaItems = await Promise.all(
      data
        .filter(item => !item.id.endsWith('/'))
        .map(async item => {
          const { data: urlData } = supabase.storage
            .from('files')
            .getPublicUrl(`${path}/${item.name}`);

          return {
            name: item.name,
            url: urlData.publicUrl,
          };
        })
    );

    return mediaItems;
  } catch (error) {
    return [];
  }
};

export const getMediaMetadata = async (url: string): Promise<Record<string, unknown> | null> => {
  try {
    // Extract path from URL if it's a public URL
    let path = url;

    if (url.includes('/storage/v1/object/public/files/')) {
      path = url.split('/storage/v1/object/public/files/').pop() || url;
    } else if (url.includes('/storage/')) {
      path = url.split('/storage/').pop() || url;
    }

    const fileName = path.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    return {
      name: fileName,
      extension: fileExtension,
      url,
      path,
    };
  } catch (error) {
    return null;
  }
};
