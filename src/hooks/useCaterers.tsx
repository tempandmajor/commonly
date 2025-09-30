import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCaterers } from '@/services/catererService';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { UnifiedCaterer, CatererFilters } from '@/types/unifiedCaterer';
import { sanitizeSearchString, validateLocation } from '@/services/validation/inputValidation';

export const useCaterers = (initialFilters: CatererFilters = {}) => {
  const [caterers, setCaterers] = useState<UnifiedCaterer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<CatererFilters>(initialFilters);
  const { locationInfo } = useGeolocation();
  const [inputError, setInputError] = useState<string | null>(null);

  const mounted = useRef(true);
  const isLoading = useRef(false);
  const lastFetch = useRef<number>(0);
  const locationFormatted = useRef<string | null>(null);
  const FETCH_THROTTLE = 3000; // 3 seconds - increased throttle

  // Update location ref when it changes
  useEffect(() => {
    locationFormatted.current = locationInfo.formatted;
  }, [locationInfo.formatted]);

  const loadCaterers = useCallback(async () => {
    if (!mounted.current || isLoading.current) return;

    // Throttle API calls more aggressively
    const now = Date.now();
    if (now - lastFetch.current < FETCH_THROTTLE) {
      return;
    }

    try {
      isLoading.current = true;
      lastFetch.current = now;

      setLoading(true);
      setError(null);

      // Validate filters before making API call
      if (filters.location && !validateLocation(filters.location)) {
        setInputError('Invalid location format');
        setLoading(false);
        return;
      }

      // Only use geolocation if no manual location is set and location is available
      const filtersWithLocation = {
          ...filters,
        location: filters.location || (locationFormatted.current && locationFormatted.current !== 'Current Location' ? locationFormatted.current : undefined),
      };

      // Sanitize inputs
      const sanitizedFilters = {
          ...filtersWithLocation,
          ...(filtersWithLocation.location && { location: sanitizeSearchString(filtersWithLocation.location) }),
          ...(filtersWithLocation.searchQuery && { searchQuery: sanitizeSearchString(filtersWithLocation.searchQuery) }),
      };

      const data = await fetchCaterers(sanitizedFilters);

      if (mounted.current) {
        setCaterers(data.caterers);
        setInputError(null);
      }

    } catch (error) {
      if (mounted.current) {
        setError(error instanceof Error ? error : new Error('Failed to load caterers'));
        toast.error('Failed to load caterers. Please try again.');
        setCaterers([]);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
      isLoading.current = false;
    }

  }, [filters, locationInfo.formatted]);

  useEffect(() => {
    mounted.current = true;

    // Only load caterers if there's no input error and not currently loading location
    if (!inputError && !locationInfo.loading) {
      const timer = setTimeout(() => {
        if (mounted.current) {
          loadCaterers();
        }
      }, 1000); // Increased delay

      return () => clearTimeout(timer);
    }

    return () => {
      mounted.current = false;
    };
  }, [filters, locationInfo.loading, inputError]);

  const updateFilters = (newFilters: Partial<CatererFilters>) => {
    // Validate inputs before updating filters
    if (newFilters.location && !validateLocation(newFilters.location)) {
      setInputError('Invalid location format');
      toast.error('Please enter a valid location');
      return;
    }

    // Clear any existing input errors
    setInputError(null);

    // Update filters
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    caterers,
    loading,
    error,
    inputError,
    filters,
    updateFilters,
    refresh: loadCaterers,
    currentLocation: locationInfo.formatted,
  };

};

export default useCaterers;
