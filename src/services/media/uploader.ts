import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

type ProgressCallback = (progress: number) => void;

export const uploadMedia = async (
  file: File,
  path: string,
  progressCallback?: ProgressCallback
) => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;

    // Simulate progress updates since Supabase doesn't provide real progress
    const progressInterval = setInterval(() => {
      if (progressCallback) {
        progressCallback(Math.random() * 90);
      }
    }, 200);

    try {
      // Upload the file to Supabase storage bucket
      const { data, error } = await supabase.storage.from('files').upload(fullPath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting
      });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      if (progressCallback) {
        progressCallback(100);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from('files').getPublicUrl(fullPath);

      return {
        url: urlData.publicUrl,
        path: fullPath,
      };
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  } catch (error) {
    throw error;
  }
};
