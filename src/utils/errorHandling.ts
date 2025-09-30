import { toast } from 'sonner';
import * as Sentry from '@sentry/react';
import { handleError } from '@/utils/errorUtils';
import { getEnvironmentConfig } from '@/utils/environmentConfig';

/**
 * Enhanced error handler with fallback UI messaging
 */
export const handlePageError = (
  error: unknown,
  context: string,
  fallbackMessage: string = 'Something went wrong',
  notifyUser: boolean = true
): void => {
  // Log error to the console

  // Report to error tracking service
  handleError(error, { context });

  // Only show toast if notifyUser is true
  if (notifyUser) {
    toast.error(fallbackMessage);
  }
};

/**
 * Production-ready async data fetcher with error handling
 * @returns A tuple with data and loading/error states
 */
export async function fetchWithErrorHandling<T>(
  fetchFn: () => Promise<T>,
  context: string,
  errorMessage: string = 'Failed to load data'
): Promise<[T | null, boolean, Error | null]> {
  try {
    const data = await fetchFn();
    return [data, false, null];
  } catch (error) {
    handlePageError(error, context, errorMessage);
    return [null, false, error instanceof Error ? error : new Error(errorMessage)];
  }
}

/**
 * Context-aware retry handler for failed operations
 */
export const createRetryHandler = (
  operation: () => Promise<any>,
  context: string,
  successMessage?: string
) => {
  return async () => {
    try {
      // Track retry attempts
      Sentry.addBreadcrumb({
        category: 'retry',
        message: `Retrying operation in ${context}`,
        level: 'info',
      });

      await operation();

      if (successMessage) {
        toast.success(successMessage);
      }

      return true;
    } catch (error) {
      handlePageError(error, `${context} retry`, 'Retry failed');
      return false;
    }
  };
};

/**
 * SEO and Metadata utility
 */
export const setPageMetadata = (
  title: string,
  description: string,
  imageUrl?: string,
  type: 'website' | 'product' | 'article' | 'profile' = 'website'
) => {
  document.title = `${title} | Commonly`;

  // Set meta description
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLElement;
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = description;
    document.head.appendChild(meta);
  }

  // Set Open Graph tags
  const ogTags = {
    'og:title': title,
    'og:description': description,
    'og:type': type,
    'og:image': imageUrl || '/logo.png',
    'og:url': window.location.href,
    'twitter:card': 'summary_large_image',
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
  });
};

/**
 * Analytics enhanced tracking for page views and interactions
 */
export const trackPageView = (pageName: string, pageProperties?: Record<string, unknown>) => {
  // Only track in production or if analytics is enabled
  if (getEnvironmentConfig().analyticsEnabled) {
    try {
      // Import analytics service dynamically
      import('@/services/analyticsService')
        .then(({ trackPageView, trackEvent }) => {
          trackPageView(pageName);
        })
        .catch(error => {});
    } catch (error) {}
  }
};
