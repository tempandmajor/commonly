interface ImageDimensions {
  width: number;
  height: number;
}

interface OptimizedImageOptions {
  quality?: number | undefined;
  blur?: boolean | undefined;
  placeholder?: boolean | undefined;
}

/**
 * Generate a data URL for a placeholder image
 */
export function generatePlaceholder(color: string = '#e5e7eb'): string {
  const svg = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create a low-quality image placeholder (LQIP)
 */
export function createLQIP(src: string, dimensions: ImageDimensions): string {
  // In a real implementation, this would generate a tiny blurred version
  // For now, we'll use a colored placeholder
  return generatePlaceholder();
}

/**
 * Get optimized image URL with proper sizing
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  options: OptimizedImageOptions = {}
): string {
  // If it's already a data URL or blob URL, return as-is
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // For now, return the original URL
  // In production, this would integrate with an image optimization service
  return src;
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Lazy load images using Intersection Observer
 */
export function setupLazyLoading(
  selector: string = 'img[data-lazy]',
  rootMargin: string = '50px'
): () => void {
  const images = document.querySelectorAll<HTMLImageElement>(selector);

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;

            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.removeAttribute('data-lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin,
      }
    );

    images.forEach(img => imageObserver.observe(img));

    // Return cleanup function
    return () => {
      images.forEach(img => imageObserver.unobserve(img));
    };
  } else {
    // Fallback for browsers without IntersectionObserver
    images.forEach(img => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
      }
    });

    return () => {};
  }
}
