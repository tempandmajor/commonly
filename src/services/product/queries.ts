import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types/product';
import { ProductQueryOptions } from './types';
import { castToProduct } from './utils';

export const getProducts = async (options: ProductQueryOptions = {}): Promise<Product[]> => {
  try {
    const { limit: limitCount = 10, lastProductId, category, inStock } = options;

    // Build the query - note: using lowercase "products" table name
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    // Note: The products table doesn't have inStock or category columns in current schema
    // So we'll just fetch all products for now

    // Add pagination if lastProductId is provided
    if (lastProductId) {
      // First get the created_at timestamp of the last item
      const { data: lastProduct, error: lastProductError } = await supabase
        .from('products')
        .select('created_at')
        .eq('id', lastProductId)
        .single();

      if (!lastProductError && lastProduct) {
        // Use the created_at value for pagination
        query = query.lt('created_at', lastProduct.created_at);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(castToProduct);
  } catch (error) {
    return [];
  }
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      return null;
    }

    return castToProduct(data);
  } catch (error) {
    return null;
  }
};

export const getProductCategories = async (): Promise<string[]> => {
  try {
    // Since the products table doesn't have a category column in the current schema,
    // we'll return some default categories for now
    const defaultCategories = [
      'Electronics',
      'Clothing',
      'Books',
      'Home & Garden',
      'Sports',
      'Toys',
      'Health & Beauty',
      'Automotive',
    ];

    return defaultCategories;
  } catch (error) {
    return [];
  }
};
