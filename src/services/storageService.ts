import { supabase } from '@/integrations/supabase/client';
// import { toast } from 'sonner'; - removed to fix dependency issue

export const uploadFile = async (
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return { url: publicUrl, path: data.path };
  } catch (error) {
    throw error;
  }
};

export const deleteFile = async (url: string) => {
  try {
    // Extract path from URL
    const urlParts = url.split('/');
    const bucket = urlParts[urlParts.length - 3];
    const path = urlParts.slice(-2).join('/');

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

export const getFileUrl = (bucket: string, path: string) => {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
};
