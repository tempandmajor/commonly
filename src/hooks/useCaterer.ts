import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import * as CatererService from '@/services/catererService';
import { toast } from 'sonner';

/**
 * Hook to search caterers with filters
 */
export const useCaterers = (params: CatererService.CatererSearchParams = {}) => {
  return useQuery({
    queryKey: ['caterers', params],
    queryFn: () => CatererService.getCaterers(params),
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to get caterer details by ID
 */
export const useCatererDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ['caterer', id],
    queryFn: () => (id ? CatererService.getCatererById(id) : null),
    enabled: !!id,
  });
};

/**
 * Hook to get featured caterers
 */
export const useFeaturedCaterers = (limit = 6) => {
  return useQuery({
    queryKey: ['caterers', 'featured', limit],
    queryFn: () => CatererService.getFeaturedCaterers(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get caterer menus
 */
export const useCatererMenus = (catererId: string | undefined) => {
  return useQuery({
    queryKey: ['caterer', catererId, 'menus'],
    queryFn: () => (catererId ? CatererService.getCatererMenus(catererId) : []),
    enabled: !!catererId,
  });
};

/**
 * Hook to get caterer reviews
 */
export const useCatererReviews = (catererId: string | undefined, page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['caterer', catererId, 'reviews', page, pageSize],
    queryFn: () =>
      catererId
        ? CatererService.getCatererReviews(catererId, page, pageSize)
        : { reviews: [], total: 0 },
    enabled: !!catererId,
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to calculate caterer pricing
 */
export const useCatererPrice = (
  caterer: CatererService.Caterer | null,
  menuId: string | null,
  guestCount: number,
  additionalServices: string[] = []
) => {
  return useQuery({
    queryKey: ['caterer', caterer?.id, 'price', menuId, guestCount, additionalServices],
    queryFn: () => {
      if (!caterer) return { basePrice: 0, serviceCharges: 0, taxes: 0, totalPrice: 0 };
      return CatererService.calculateCatererPrice(caterer, menuId, guestCount, additionalServices);
    },
    enabled: !!caterer && guestCount > 0,
  });
};

/**
 * Hook to get search suggestions
 */
export const useCatererSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['caterers', 'suggestions', query],
    queryFn: () => CatererService.getCatererSearchSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a caterer
 */
export const useCreateCaterer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: CatererService.CreateCatererData) => {
      if (!user) throw new Error('User must be logged in to create a caterer listing');
      return CatererService.createCaterer({ ...data, owner_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterers'] });
      toast.success('Caterer listing created successfully! It will be reviewed before going live.');
    },
    onError: error => {
      console.error('Error creating caterer:', error);
      toast.error('Failed to create caterer listing');
    },
  });
};

/**
 * Hook to update a caterer
 */
export const useUpdateCaterer = (catererId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<CatererService.CreateCatererData>) => {
      return CatererService.updateCaterer(catererId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterer', catererId] });
      queryClient.invalidateQueries({ queryKey: ['caterers'] });
      toast.success('Caterer listing updated successfully');
    },
    onError: error => {
      console.error('Error updating caterer:', error);
      toast.error('Failed to update caterer listing');
    },
  });
};

/**
 * Hook to delete a caterer
 */
export const useDeleteCaterer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (catererId: string) => {
      return CatererService.deleteCaterer(catererId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterers'] });
      toast.success('Caterer listing deleted successfully');
    },
    onError: error => {
      console.error('Error deleting caterer:', error);
      toast.error('Failed to delete caterer listing');
    },
  });
};

/**
 * Hook to create a menu
 */
export const useCreateCatererMenu = (catererId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuData: CatererService.CreateMenuData) => {
      return CatererService.createCatererMenu(menuData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterer', catererId, 'menus'] });
      toast.success('Menu created successfully');
    },
    onError: error => {
      console.error('Error creating menu:', error);
      toast.error('Failed to create menu');
    },
  });
};

/**
 * Hook to create a review
 */
export const useCreateCatererReview = (catererId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (reviewData: CatererService.CreateReviewData) => {
      if (!user) throw new Error('User must be logged in to create a review');
      return CatererService.createCatererReview(reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caterer', catererId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['caterer', catererId] }); // Refresh caterer details to update rating
      toast.success('Review submitted successfully');
    },
    onError: error => {
      console.error('Error creating review:', error);
      toast.error('Failed to submit review');
    },
  });
};
