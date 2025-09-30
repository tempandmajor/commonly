import { Product } from '@/lib/types/product';

/**
 * Cast database row to Product type
 */
export const castToProduct = (data: unknown): Product => {
  return {
    id: data.id,
    name: data.name,
    title: data.name, // Use name as title for compatibility
    description: data.description || '',
    detailedDescription: data.description || '',
    price: (data.price_in_cents || 0) / 100, // Convert cents to dollars
    compareAtPrice: undefined,
    images: data.image_url ? [data.image_url] : [],
    category: 'General', // Default category since column doesn't exist
    tags: [],
    createdAt: data.created_at,
    inStock: data.status === 'active',
    stockQuantity: data.stock_quantity || 0,
    variations: [],
    shipping: undefined,
    sellerId: data.creator_id || '',
    sellerName: 'Store Owner',
    sellerAvatar: undefined,
    weight: undefined,
    dimensions: undefined,
    deliveryTime: undefined,
    printProvider: undefined,
    features: [],
  };
};
