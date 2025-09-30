import { uploadMedia } from '../media/uploader';
import { generateCdnUrl } from '../media/cdnUtils';
import { handleError } from '@/utils/errorUtils';

export const uploadContentImage = async (
  file: File,
  contentId?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const path = contentId ? `content/${contentId}/images` : `content/shared/images`;

    const { url } = await uploadMedia(file, path, onProgress);

    // Generate CDN URL
    const cdnUrl = generateCdnUrl(url);

    return cdnUrl;
  } catch (error) {
    handleError(error, { contentId, fileName: file.name }, 'Failed to upload image');
    throw error;
  }
};
