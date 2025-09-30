import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchCommunities } from '@/services/community';

export interface CommunitySearchFilters {
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'created_at' | 'member_count' | 'name';
  showPrivate: boolean | undefined;
  currentPage: number;
}

export const useCommunitySearch = () => {
  const [filters, setFilters] = useState<CommunitySearchFilters>({
    searchQuery: '',
    selectedCategory: 'All',
    sortBy: 'created_at',
    currentPage: 1,
  });

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const searchParams = useMemo(() => ({
    query: debouncedSearchQuery,
          ...(filters.selectedCategory !== 'All' && { tags: [filters.selectedCategory] }),
    isPrivate: filters.showPrivate,
    page: filters.currentPage,
    pageSize: 12,
    sortBy: filters.sortBy,
    sortDirection: filters.sortBy === 'name' ? 'asc' as const : 'desc' as const,
  }), [debouncedSearchQuery, filters.selectedCategory, filters.showPrivate, filters.currentPage, filters.sortBy]);

  const { data: searchResults, isLoading, error } = useSearchCommunities(searchParams);

  const updateSearch = useCallback((query: string) => {
    setFilters(prev => ({
          ...prev,
      searchQuery: query,
      currentPage: 1,
    }));
  }, []);

  const updateCategory = useCallback((category: string) => {
    setFilters(prev => ({
          ...prev,
      selectedCategory: category,
      currentPage: 1,
    }));
  }, []);

  const updateSort = useCallback((sortBy: 'created_at' | 'member_count' | 'name') => {
    setFilters(prev => ({
          ...prev,
      sortBy,
      currentPage: 1,
    }));
  }, []);

  const updatePrivacy = useCallback((showPrivate: boolean | undefined) => {
    setFilters(prev => ({
          ...prev,
      showPrivate,
      currentPage: 1,
    }));
  }, []);

  const loadMore = useCallback(() => {
    setFilters(prev => ({
          ...prev,
      currentPage: prev.currentPage + 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedCategory: 'All',
      sortBy: 'created_at',
      currentPage: 1,
    });
  }, []);

  return {
    filters,
    searchResults,
    isLoading,
    error,
    updateSearch,
    updateCategory,
    updateSort,
    updatePrivacy,
    loadMore,
    resetFilters,
  };

};