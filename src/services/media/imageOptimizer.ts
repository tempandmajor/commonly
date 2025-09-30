import { MediaOptimizationOptions, ThumbnailOptions } from './types';

export const createThumbnail = async (
  file: File,
  options: ThumbnailOptions = { width: 300, quality: 80 }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const aspectRatio = img.width / img.height;
        const newWidth = options.width;
        const newHeight = newWidth / aspectRatio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create thumbnail'));
            }
          },
          file.type,
          options.quality / 100
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
  });
};

export const optimizeImage = async (
  file: File,
  options: MediaOptimizationOptions = { maxWidth: 1920, quality: 80 }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        if (img.width <= (options.maxWidth || 1920)) {
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const aspectRatio = img.width / img.height;
        const newWidth = options.maxWidth || 1920;
        const newHeight = newWidth / aspectRatio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not optimize image'));
            }
          },
          file.type,
          options.quality || 80
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
  });
};
