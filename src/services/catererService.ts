import { supabase } from '@/integrations/supabase/client';

export interface Caterer {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  location_id: string | null;
  cuisine_types: string[] | null;
  service_types: string[] | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  images: string[] | null;
  cover_image: string | null;
  is_available: boolean | null;
  minimum_order: number | null;
  max_guest_capacity: number | null;
  owner_id: string | null;
  status: string | null;
  featured: boolean | null;
  specialties: string[] | null;
  special_diets: string[] | null;
  metadata: any;
  created_at: string | null;
  updated_at: string | null;
  menus?: CatererMenu[] | undefined;
  reviews?: CatererReview[] | undefined;
}

export interface CatererMenu {
  id: string;
  caterer_id: string;
  name: string;
  description: string | null;
  price_per_person: number;
  min_guests: number;
  max_guests: number | null;
  items: string[];
  dietary_restrictions: string[];
  preparation_time_hours: number;
  is_available: boolean;
  category: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatererReview {
  id: string;
  caterer_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  event_date: string | null;
  guest_count: number | null;
  menu_used: string | null;
  would_recommend: boolean;
  verified_booking: boolean;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string | undefined;
    name?: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface CreateCatererData {
  name: string;
  description?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  website?: string | undefined;
  address?: string | undefined;
  cuisine_types?: string[] | undefined;
  service_types?: string[] | undefined;
  price_range?: string | undefined;
  minimum_order?: number | undefined;
  max_guest_capacity?: number | undefined;
  specialties?: string[] | undefined;
  special_diets?: string[] | undefined;
  images?: string[] | undefined;
  cover_image?: string | undefined;
  owner_id?: string | undefined;
}

export interface CreateMenuData {
  caterer_id: string;
  name: string;
  description?: string | undefined;
  price_per_person: number;
  min_guests: number;
  max_guests?: number | undefined;
  items: string[];
  dietary_restrictions?: string[] | undefined;
  preparation_time_hours: number;
  category: string;
  image_url?: string | undefined;
}

export interface CreateReviewData {
  caterer_id: string;
  rating: number;
  title?: string | undefined;
  comment?: string | undefined;
  event_date?: string | undefined;
  guest_count?: number | undefined;
  menu_used?: string | undefined;
  would_recommend: boolean;
}

export interface CatererSearchParams {
  query?: string | undefined;
  location?: string | undefined;
  cuisine_types?: string[] | undefined;
  service_types?: string[] | undefined;
  price_range?: string | undefined;
  min_capacity?: number | undefined;
  max_capacity?: number | undefined;
  specialties?: string[] | undefined;
  special_diets?: string[] | undefined;
  min_rating?: number | undefined;
  featured_only?: boolean | undefined;
  available_only?: boolean | undefined;
  page?: number | undefined;
  page_size?: number | undefined;
  sort_by?: 'name' | undefined| 'rating' | 'created_at' | 'price_range' | 'review_count';
  sort_direction?: 'asc' | undefined| 'desc';
}

export interface CatererSearchResult {
  caterers: Caterer[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Core caterer functions
export const getCaterers = async (
  params: CatererSearchParams = {}
): Promise<CatererSearchResult> => {
  try {
    const {
      query,
      location,
      cuisine_types,
      service_types,
      price_range,
      min_capacity,
      max_capacity,
      specialties,
      special_diets,
      min_rating,
      featured_only,
      available_only = true,
      page = 1,
      page_size = 12,
      sort_by = 'created_at',
      sort_direction = 'desc',
    } = params;

    let queryBuilder = supabase.from('caterers').select('*', { count: 'exact' });

    // Apply filters
    if (available_only) {
      queryBuilder = queryBuilder.eq('is_available', true);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,address.ilike.%${query}%`
      );
    }

    if (location) {
      queryBuilder = queryBuilder.ilike('address', `%${location}%`);
    }

    if (cuisine_types && cuisine_types.length > 0) {
      queryBuilder = queryBuilder.overlaps('cuisine_types', cuisine_types);
    }

    if (service_types && service_types.length > 0) {
      queryBuilder = queryBuilder.overlaps('service_types', service_types);
    }

    if (price_range) {
      queryBuilder = queryBuilder.eq('price_range', price_range);
    }

    if (min_capacity) {
      queryBuilder = queryBuilder.gte('max_guest_capacity', min_capacity);
    }

    if (max_capacity) {
      queryBuilder = queryBuilder.lte('max_guest_capacity', max_capacity);
    }

    if (specialties && specialties.length > 0) {
      queryBuilder = queryBuilder.overlaps('specialties', specialties);
    }

    if (special_diets && special_diets.length > 0) {
      queryBuilder = queryBuilder.overlaps('special_diets', special_diets);
    }

    if (min_rating) {
      queryBuilder = queryBuilder.gte('rating', min_rating);
    }

    if (featured_only) {
      queryBuilder = queryBuilder.eq('featured', true);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_direction === 'asc' });

    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching caterers:', error);
      throw error;
    }

    return {
      caterers: (data || []) as unknown as Caterer[],
      total: count || 0,
      page,
      page_size,
      has_more: count ? from + data.length < count : false,
    };
  } catch (error) {
    console.error('Error in getCaterers:', error);
    throw error;
  }
};

export const getCatererById = async (id: string): Promise<Caterer | null> => {
  try {
    const { data, error } = await supabase.from('caterers').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching caterer:', error);
      throw error;
    }

    return data as unknown as Caterer;
  } catch (error) {
    console.error('Error in getCatererById:', error);
    throw error;
  }
};

export const createCaterer = async (catererData: CreateCatererData): Promise<Caterer> => {
  try {
    const { data, error } = await supabase
      .from('caterers')
      .insert({
          ...catererData,
        rating: 0,
        review_count: 0,
        is_available: true,
        featured: false,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating caterer:', error);
      throw error;
    }

    return data as unknown as Caterer;
  } catch (error) {
    console.error('Error in createCaterer:', error);
    throw error;
  }
};

export const updateCaterer = async (
  id: string,
  updates: Partial<CreateCatererData>
): Promise<Caterer> => {
  try {
    const { data, error } = await supabase
      .from('caterers')
      .update({
          ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating caterer:', error);
      throw error;
    }

    return data as unknown as Caterer;
  } catch (error) {
    console.error('Error in updateCaterer:', error);
    throw error;
  }
};

export const deleteCaterer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('caterers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting caterer:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteCaterer:', error);
    throw error;
  }
};

// Menu functions
export const getCatererMenus = async (catererId: string): Promise<CatererMenu[]> => {
  try {
    const { data, error } = await supabase
      .from('caterer_menus')
      .select('*')
      .eq('caterer_id', catererId)
      .eq('available', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching caterer menus:', error);
      throw error;
    }

    const typedData = (data || []) as any[];
    return typedData.map(menu => ({
      id: menu.id,
      caterer_id: menu.caterer_id,
      name: menu.name,
      description: menu.description,
      price_per_person: Number(menu.price) as number,
      min_guests: 1,
      max_guests: null,
      items: [],
      dietary_restrictions: menu.dietary_restrictions || [],
      preparation_time_hours: 24,
      is_available: menu.available,
      category: menu.category || 'main',
      image_url: null,
      created_at: menu.created_at,
      updated_at: menu.updated_at,
    }));
  } catch (error) {
    console.error('Error in getCatererMenus:', error);
    return [];
  }
};

export const createCatererMenu = async (menuData: CreateMenuData): Promise<CatererMenu> => {
  try {
    // TODO: Implement when caterer_menus table is created in database
    throw new Error('Menu functionality not yet available - database table required');
  } catch (error) {
    console.error('Error in createCatererMenu:', error);
    throw error;
  }
};

// Review functions
export const getCatererReviews = async (
  catererId: string,
  page = 1,
  pageSize = 10
): Promise<{ reviews: CatererReview[]; total: number }> => {
  try {
    // Return mock data since caterer_reviews table is not yet created
    const mockReviews: CatererReview[] = [
      {
        id: '1',
        caterer_id: catererId,
        user_id: 'user1',
        rating: 5,
        title: 'Excellent Service',
        comment: 'Amazing food and professional service!',
        event_date: '2024-01-15',
        guest_count: 50,
        helpful_count: 3,
        would_recommend: true,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        user: {
          id: 'user1',
          display_name: 'John Smith',
          avatar_url: null,
        },
      },
    ];

    return {
      reviews: mockReviews,
      total: mockReviews.length,
    };

    if (error) {
      console.error('Error fetching caterer reviews:', error);
      throw error;
    }

    const reviews = (data || []).map(review => ({
      id: review.id,
      caterer_id: review.caterer_id,
      user_id: review.user_id,
      rating: review.rating,
      title: null,
      comment: review.review_text,
      event_date: null,
      guest_count: null,
      menu_used: null,
      would_recommend: review.rating >= 4,
      verified_booking: false,
      helpful_votes: 0,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user: review.user,
    }));

    return { reviews, total: count || 0 };
  } catch (error) {
    console.error('Error in getCatererReviews:', error);
    return { reviews: [], total: 0 };
  }
};

export const createCatererReview = async (reviewData: CreateReviewData): Promise<CatererReview> => {
  try {
    // TODO: Implement when caterer_reviews table is created in database
    throw new Error('Review functionality not yet available - database table required');
  } catch (error) {
    console.error('Error in createCatererReview:', error);
    throw error;
  }
};

// Price calculation
export const calculateCatererPrice = (
  caterer: Caterer,
  menuId: string | null,
  guestCount: number,
  additionalServices: string[] = []
): { basePrice: number; serviceCharges: number; taxes: number; totalPrice: number } => {
  try {
    // Base price calculation
    let basePrice = 0;

    // If menu is selected, use menu pricing (would need menu data)
    // For now, use estimated pricing based on price range
    if (caterer.price_range) {
      switch (caterer.price_range) {
        case '$':
          basePrice = guestCount * 15; // $15 per person
          break;
        case '$$':
          basePrice = guestCount * 25; // $25 per person
          break;
        case '$$$':
          basePrice = guestCount * 40; // $40 per person
          break;
        case '$$$$':
          basePrice = guestCount * 60; // $60 per person
          break;
        default:
          basePrice = guestCount * 25;
      }
    } else {
      basePrice = guestCount * 25; // Default $25 per person
    }

    // Apply minimum order
    if (caterer.minimum_order && basePrice < caterer.minimum_order) {
      basePrice = caterer.minimum_order;
    }

    // Service charges (10% of base price)
    const serviceCharges = basePrice * 0.1;

    // Taxes (8% of base + service)
    const taxes = (basePrice + serviceCharges) * 0.08;

    const totalPrice = basePrice + serviceCharges + taxes;

    return {
      basePrice: Math.round(basePrice * 100) / 100,
      serviceCharges: Math.round(serviceCharges * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    return { basePrice: 0, serviceCharges: 0, taxes: 0, totalPrice: 0 };
  }
};

// Featured caterers
export const getFeaturedCaterers = async (limit = 6): Promise<Caterer[]> => {
  try {
    const { data, error } = await supabase
      .from('caterers')
      .select('*')
      .eq('featured', true)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured caterers:', error);
      throw error;
    }

    return (data || []) as unknown as Caterer[];
  } catch (error) {
    console.error('Error in getFeaturedCaterers:', error);
    throw error;
  }
};

// Search suggestions
export const getCatererSearchSuggestions = async (query: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('caterers')
      .select('name, cuisine_types, specialties')
      .or(`name.ilike.%${query}%,cuisine_types.cs.{${query}},specialties.cs.{${query}}`)
      .limit(10);

    if (error) {
      console.error('Error fetching search suggestions:', error);
      throw error;
    }

    const suggestions = new Set<string>();

    data?.forEach(caterer => {
      // Add caterer name if it matches
      if (caterer.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(caterer.name);
      }

      // Add matching cuisine types
      caterer.cuisine_types.forEach((cuisine: string) => {
        if (cuisine.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(cuisine);
        }
      });

      // Add matching specialties
      caterer.specialties.forEach((specialty: string) => {
        if (specialty.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(specialty);
        }
      });
    });

    return Array.from(suggestions).slice(0, 8);
  } catch (error) {
    console.error('Error in getCatererSearchSuggestions:', error);
    return [];
  }
};
