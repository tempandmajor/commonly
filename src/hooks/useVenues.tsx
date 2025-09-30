import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getVenues, updateVenueStatus, toggleFeatured } from '@/services/venue';
import type { Venue } from '@/lib/types/venue';

// Keep the interfaces for VenueFilters as is
export interface VenueFilters {
  type?: string | undefined;
  location?: string | undefined;
  capacity?: string | undefined;
  priceRange?: string | undefined;
  sortBy?: string | undefined;
  searchQuery?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  date?: string | undefined;
}

export const useVenues = (initialFilters: VenueFilters = {}) => {
  const [filters, setFilters] = useState<VenueFilters>(initialFilters);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['venues', filters],
    queryFn: () => {
      // Convert string capacity to number for the API call
      const apiFilters = {
          ...filters,
          ...(filters.capacity && { capacity: parseInt(filters.capacity) }),
      };
      return getVenues(apiFilters);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load venues');
    }
  }, [error]);

  const updateFilters = (newFilters: Partial<VenueFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Implement updateVenueStatus handler
  const handleUpdateVenueStatus = async (
    venueId: string,
    status: 'pending' | 'active' | 'suspended'
  ) => {
    try {
      await updateVenueStatus(venueId, status);
      toast.success(`Venue status updated to ${status}`);
      refetch();
      return true;
    } catch (error) {
      toast.error('Failed to update venue status');
      return false;
    }
  };

  // Implement toggleFeatured handler
  const handleToggleFeatured = async (venueId: string) => {
    try {
      await toggleFeatured(venueId);
      toast.success('Featured status updated');
      refetch();
      return true;
    } catch (error) {
      toast.error('Failed to update featured status');
      return false;
    }
  };

  // Ensure data is an array and provide fallback structure
  const venues = Array.isArray(data) ? data : [];

  return {
    venues,
    totalVenues: venues.length,
    hasMore: false, // Simple implementation - would need pagination logic
    loading,
    filters,
    updateFilters,
    refetch,
    // Add the new functions
    updateVenueStatus: handleUpdateVenueStatus,
    toggleFeatured: handleToggleFeatured,
  };

};
