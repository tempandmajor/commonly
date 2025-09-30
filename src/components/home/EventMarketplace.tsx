import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEventSearch } from '@/hooks/useEventSearch';
import { useSearchParams } from 'react-router-dom';
import GridViewToggle from './GridViewToggle';
import EventsGrid from './EventsGrid';
import { deleteAnonymousEvents } from '@/services/eventService';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useSupabase } from '@/contexts/SupabaseContext';
import ErrorBoundaryComponent from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EventMarketplace');

const EventMarketplace = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { isAdmin } = useAuth();
  const { isInitialized } = useSupabase();
  const analytics = useAnalytics('/events', 'Event Marketplace');

  // Use ref to track previous category param to prevent unnecessary updates
  const prevCategoryParamRef = useRef<string | null>(null);

  // Memoize search options to prevent unnecessary re-renders
  const searchOptions = useMemo(
    () => ({
      category: categoryParam || undefined,
      pageSize: 9, // Load in multiples of 3 for grid layout
    }),
    [categoryParam]
  );

  const {
    events,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    updateFilters,
    initialLoadComplete,
    retry,
    error,
  } = useEventSearch(searchOptions);

  // Memoize the filter update function to prevent unnecessary renders
  const handleCategoryChange = useCallback(
    (category: string | undefined) => {
      logger.info('Updating category filter', { category });
      updateFilters({
        category: category,
      });
      analytics.trackEvent('filter_events_by_category', { category: category || 'all' });
    },
    [updateFilters, analytics]
  );

  // Update filters when category param changes - FIX: Only update when param actually changes
  useEffect(() => {
    if (isInitialized && prevCategoryParamRef.current !== categoryParam) {
      logger.info('Category param changed', { categoryParam });
      prevCategoryParamRef.current = categoryParam;

      // Call updateFilters directly to avoid dependency issues
      updateFilters({
        category: categoryParam || undefined,
      });
      analytics.trackEvent('filter_events_by_category', { category: categoryParam || 'all' });
    }
  }, [categoryParam, isInitialized, updateFilters, analytics]);

  // Admin function to delete anonymous events
  const handleDeleteAnonymousEvents = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const deletedCount = await deleteAnonymousEvents();
      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} anonymous events`);
        analytics.trackEvent('admin_delete_anonymous_events', { count: deletedCount });
        // Refresh events
        handleCategoryChange(categoryParam || undefined);
      } else {
        toast.info('No anonymous events found');
      }
    } catch (error) {
      logger.error('Error deleting anonymous events:', error);
      toast.error('Failed to delete anonymous events');
      analytics.trackEvent('admin_delete_anonymous_events_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [isAdmin, analytics, handleCategoryChange, categoryParam]);

  const handleRetry = useCallback(() => {
    retry();
    analytics.trackEvent('retry_events_load');
  }, [retry, analytics]);

  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'list') => {
      setViewMode(mode);
      analytics.trackEvent('change_view_mode', { mode });
    },
    [analytics]
  );

  const handleLoadMore = useCallback(() => {
    loadMore();
    analytics.trackEvent('load_more_events');
  }, [loadMore, analytics]);

  // Track page performance
  useEffect(() => {
    if (initialLoadComplete && events.length > 0) {
      logger.info('Events loaded successfully', {
        count: events.length,
        hasMore,
        category: categoryParam || 'all',
      });
    }
  }, [initialLoadComplete, events.length, hasMore, categoryParam]);

  // Handle empty state
  if (!isInitialized) {
    return null;
  }

  return (
    <section className='py-12'>
      <div className='container px-4 md:px-6'>
        <ErrorBoundaryComponent>
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                {categoryParam ? `${categoryParam} Events` : 'Discover Events'}
              </h2>
              <p className='text-sm text-muted-foreground mt-1'>
                {events.length > 0
                  ? `${events.length}${hasMore ? '+' : ''} events available`
                  : 'Loading events...'}
              </p>
            </div>
            <div className='flex items-center gap-3'>
              {isAdmin && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleDeleteAnonymousEvents}
                  className='text-red-600 hover:text-red-800'
                >
                  Delete Anonymous Events
                </Button>
              )}
              <GridViewToggle viewMode={viewMode} onViewChange={handleViewModeChange} />
            </div>
          </div>

          {error && !initialLoading && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription className='flex justify-between items-center'>
                <span>{error}</span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRetry}
                  className='flex items-center gap-1'
                >
                  <RefreshCw className='h-3 w-3' />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <EventsGrid
            events={events}
            viewMode={viewMode}
            loading={loading}
            initialLoading={initialLoading}
            hasMore={hasMore}
            loadMore={handleLoadMore}
            initialLoadComplete={initialLoadComplete}
            error={error}
            onRetry={handleRetry}
          />
        </ErrorBoundaryComponent>
      </div>
    </section>
  );
};

export default EventMarketplace;
