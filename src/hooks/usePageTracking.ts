import { useEffect } from 'react';
import { trackPageView } from '@/services/analyticsService';

export const usePageTracking = (pathname: string, pageTitle?: string) => {
  useEffect(() => {
    trackPageView(pathname);

    // Update document title if provided
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [pathname, pageTitle]);
};
