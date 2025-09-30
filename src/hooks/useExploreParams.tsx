import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

interface ExploreParams {
  category: string | null;
  search: string;
  location: string;
  priceRange: string;
  date: string;
}

export const useExploreParams = (defaultLocation: string = 'All locations') => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shouldUpdateUrl, setShouldUpdateUrl] = useState(false);

  const [params, setParams] = useState<ExploreParams>({
    category: searchParams.get('category'),
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || defaultLocation,
    priceRange: searchParams.get('priceRange') || 'all',
    date: searchParams.get('date') || '',
  });

  const updateParams = useCallback((updates: Partial<ExploreParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
    setShouldUpdateUrl(true);
  }, []);

  // Update URL when params change
  useEffect(() => {
    if (!shouldUpdateUrl) return;

    const newParams = new URLSearchParams();
    const currentParams = new URLSearchParams(searchParams);

    if (params.category) {
      newParams.set('category', params.category);
    }

    if (params.search) {
      newParams.set('search', params.search);
    }

    if (params.location && params.location !== 'All locations') {
      newParams.set('location', params.location);
    }

    if (params.priceRange && params.priceRange !== 'all') {
      newParams.set('priceRange', params.priceRange);
    }

    if (params.date) {
      newParams.set('date', params.date);
    }

    // Only update if the URL params have actually changed
    if (newParams.toString() !== currentParams.toString()) {
      // Remove the replace:true option which can cause unwanted page refreshes
      setSearchParams(newParams);
    }

    setShouldUpdateUrl(false);
  }, [params, setSearchParams, shouldUpdateUrl, searchParams]);

  return {
    params,
    updateParams,
  };
};
