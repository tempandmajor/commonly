import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Event } from '@/lib/types/event';
import { EventSearchProps } from '@/lib/types/search';
import { getEvents } from '@/services/event/queries';
import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';

export function useEventSearch(initialFilters: Partial<EventSearchProps>) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Memoize initial filters to prevent unnecessary re-initialization
  const memoizedInitialFilters = useMemo(
    () => ({
      category: initialFilters.category,
      searchQuery: initialFilters.searchQuery,
      location: initialFilters.location || 'All locations',
      isFreeOnly: initialFilters.isFreeOnly || false,
      priceRange: initialFilters.priceRange,
      isNearMe: initialFilters.isNearMe || false,
      pageSize: initialFilters.pageSize || 10,
    }),
    [
      initialFilters.category,
      initialFilters.searchQuery,
      initialFilters.location,
      initialFilters.isFreeOnly,
      initialFilters.priceRange,
      initialFilters.isNearMe,
      initialFilters.pageSize,
    ]
  );

  // Use the memoized initial filters for state initialization
  const [filters, setFilters] = useState<EventSearchProps>(memoizedInitialFilters);

  const [sortOrder, setSortOrder] = useState<'newest' | 'popular' | 'funded'>('newest');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFiltersRef = useRef<EventSearchProps>(filters);

  // Update filters when initialFilters change
  useEffect(() => {
    setFilters(memoizedInitialFilters);
  }, [memoizedInitialFilters]);

  // Memoize filter comparison - use a more stable comparison
  const filtersChanged = useMemo(() => {
    const current = JSON.stringify(filters);
    const previous = JSON.stringify(lastFiltersRef.current);
    const changed = current !== previous;

    if (changed) {
      lastFiltersRef.current = filters;
    }
    return changed;
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<EventSearchProps>) => {
    setFilters(currentFilters => {
      const updatedFilters = {
          ...currentFilters,
          ...newFilters,
      };

      // Only update if the filters actually changed
      if (JSON.stringify(updatedFilters) === JSON.stringify(currentFilters)) {
        return currentFilters;
      }

      return updatedFilters;
    });
    // Reset page and retry count when filters change
    setCurrentPage(0);
    setRetryCount(0);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const limitCount = filters.pageSize || 10;

      // For now, just fetch the same limit again
      // In a real implementation, you'd need to update getEvents to support pagination
      const moreEvents = await getEvents(limitCount);

      if (moreEvents && moreEvents.length > 0) {
        // Filter out duplicates based on event ID
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(e => e.id));
          const newEvents = moreEvents!.filter(e => !existingIds.has(e.id));
          return [...prevEvents, ...newEvents];
        });
        setCurrentPage(prev => prev + 1);
        // For now, disable load more after first load since we can't paginate
        setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error('Failed to load more events');
    } finally {
      setLoading(false);
    }
  }, [filters, loading, hasMore, currentPage]);

  // Add retry function to refresh events
  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    toast.info('Retrying event fetch...');
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      // Cancel any in-progress requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Pass both limit and filters to getEvents function
        const limitCount = filters.pageSize || 10;

        // Pass the filters object to enable filtering by category, search, etc.
        const fetchedEvents = await getEvents(limitCount, filters);

        // Only update state if this request hasn't been aborted
        if (!controller.signal.aborted) {
          setEvents(fetchedEvents || []);
          setHasMore(fetchedEvents ? fetchedEvents.length >= limitCount : false);
          setError(null);
          setCurrentPage(0);
        }
      } catch (error) {
        // Only update state if this request hasn't been aborted
        if (!controller.signal.aborted) {
          setEvents([]);
          setHasMore(false);
          setError('Failed to load events. Please try again.');
          handleError(error, { filters }, 'Failed to load events');
        }
      } finally {
        // Only update state if this request hasn't been aborted
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoading(false);
          setInitialLoadComplete(true);
          abortControllerRef.current = null;
        }
      }
    };

    // Only fetch if filters actually changed or it's a retry
    if (filtersChanged || retryCount > 0) {
      fetchEvents();
    }

    return () => {
      // Clean up any pending requests when component unmounts or filters change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filtersChanged, retryCount, filters]);

  return {
    events,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    updateFilters,
    filters,
    sortOrder,
    setSortOrder,
    initialLoadComplete,
    retry,
    error,
  };
}
