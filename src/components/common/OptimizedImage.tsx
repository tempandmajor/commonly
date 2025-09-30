import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  priority?: boolean | undefined; // For above-the-fold images
  placeholder?: string | undefined;
  onLoad?: () => void | undefined;
  onError?: () => void | undefined;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading (unless priority)
  useEffect(() => {
    if (priority) return; // Skip lazy loading for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Generate optimized image sources
  const getOptimizedSrc = (originalSrc: string, format?: 'webp' | 'jpg') => {
    if (!originalSrc || originalSrc.startsWith('data:')) return originalSrc;

    // For external URLs, return as-is (would need a CDN service for optimization)
    if (originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, we could add query parameters for optimization
    // This would work with services like Cloudinary, ImageKit, etc.
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (format) params.set('f', format);

    const queryString = params.toString();
    return queryString ? `${originalSrc}?${queryString}` : originalSrc;
  };

  // Fallback placeholder
  const defaultPlaceholder =
    placeholder ||
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 400}' height='${height || 300}' viewBox='0 0 ${width || 400} ${height || 300}'%3E%3Crect width='${width || 400}' height='${height || 300}' fill='%23f3f4f6'/%3E%3Ctext x='${width || 400} / 2}' y='${height || 300} / 2}' text-anchor='middle' dominant-baseline='middle' font-family='system-ui' font-size='16' fill='%236b7280'%3ELoading...%3C/text%3E%3C/svg%3E`;

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {isInView ? (
        <>
          {/* Modern browsers with WebP support */}
          <picture>
            <source srcSet={getOptimizedSrc(src, 'webp')} type='image/webp' />
            <img
              ref={imgRef}
              src={imageError ? defaultPlaceholder : getOptimizedSrc(src)}
              alt={alt}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading={priority ? 'eager' : 'lazy'}
              decoding='async'
              onLoad={handleLoad}
              onError={handleError}
              width={width}
              height={height}
            />
          </picture>

          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className='absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center'>
              <div className='text-gray-500 text-sm font-medium'>Loading image...</div>
            </div>
          )}
        </>
      ) : (
        // Placeholder while not in view
        <div
          className='w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center'
          style={{ width, height }}
        >
          <div className='text-gray-500 text-sm font-medium'>{alt}</div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
