import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches product categories from the database
 * @returns Array of category names
 */
export const getProductCategories = async (): Promise<string[]> => {
  try {
    // First try to get categories from the dedicated categories table
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .order('name');

    if (!categoriesError && categoriesData && categoriesData.length > 0) {
      return categoriesData.map(cat => cat.name);
    }

    // Fallback: get unique categories from products table
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (productsError) throw productsError;

    // Extract unique categories
    const uniqueCategories = [
          ...new Set(
        productsData
          ?.filter(product => product.category) // Filter out null/undefined
          .map(product => product.category as string) || [] // Type assertion since we filtered nulls
      ),
    ];

    return uniqueCategories.length > 0 ? uniqueCategories : [];
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
};

/**
 * Fetches popular categories with product counts
 * @returns Array of category objects with name and count
 */
export const getPopularCategories = async (
  limit: number = 5
): Promise<{ name: string; count: number }[]> => {
  try {
    // TODO: Implement category analytics when product category system is implemented
    console.info('Popular categories requested but category system not yet implemented');
    return [];
  } catch (error) {
    console.error('Error fetching popular categories:', error);
    return [];
  }
};
