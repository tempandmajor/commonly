/**
 * Wishlist Service
 * Handles user wishlists for products
 */
import { supabase } from '@/integrations/supabase/client';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string | undefined;
    name: string;
    description: string;
    price_in_cents: number;
    images: string[];
    image_url: string;
    category: string;
    in_stock: boolean;
    creator: {
      name: string;
      display_name: string;
    };
  };
}

class WishlistService {
  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string): Promise<WishlistItem> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        product_id: productId,
      })
      .select(
        `
        *,
        product:products(
          id,
          name,
          description,
          price_in_cents,
          images,
          image_url,
          category,
          in_stock,
          creator:users!products_creator_id_fkey(name, display_name)
        )
      `
      )
      .single();

    if (error) throw error;
    return data as WishlistItem;
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;
  }

  /**
   * Check if product is in user's wishlist
   */
  async isInWishlist(productId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(userId?: string): Promise<WishlistItem[]> {
    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(
        `
        *,
        product:products(
          id,
          name,
          description,
          price_in_cents,
          images,
          image_url,
          category,
          in_stock,
          creator:users!products_creator_id_fkey(name, display_name)
        )
      `
      )
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as WishlistItem[];
  }

  /**
   * Get wishlist item count for user
   */
  async getWishlistCount(userId?: string): Promise<number> {
    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;
      targetUserId = user.id;
    }

    const { count, error } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get multiple wishlist statuses for products
   */
  async getWishlistStatuses(productIds: string[]): Promise<Record<string, boolean>> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', productIds);

    if (error) throw error;

    const statuses: Record<string, boolean> = {};
    productIds.forEach(id => {
      statuses[id] = false;
    });

    (data || []).forEach(item => {
      statuses[item.product_id] = true;
    });

    return statuses;
  }

  /**
   * Toggle product in wishlist
   */
  async toggleWishlist(productId: string): Promise<{ isInWishlist: boolean; message: string }> {
    const isCurrentlyInWishlist = await this.isInWishlist(productId);

    if (isCurrentlyInWishlist) {
      await this.removeFromWishlist(productId);
      return {
        isInWishlist: false,
        message: 'Removed from wishlist',
      };
    } else {
      await this.addToWishlist(productId);
      return {
        isInWishlist: true,
        message: 'Added to wishlist',
      };
    }
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Get wishlist items by category
   */
  async getWishlistByCategory(category: string): Promise<WishlistItem[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('wishlists')
      .select(
        `
        *,
        product:products(
          id,
          name,
          description,
          price_in_cents,
          images,
          image_url,
          category,
          in_stock,
          creator:users!products_creator_id_fkey(name, display_name)
        )
      `
      )
      .eq('user_id', user.id)
      .eq('product.category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as WishlistItem[];
  }

  /**
   * Share wishlist - get public link data
   */
  async getPublicWishlist(userId: string): Promise<{
    user: { name: string; avatar_url?: string };
    items: WishlistItem[];
  }> {
    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, display_name, avatar_url')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get wishlist items
    const items = await this.getWishlist(userId);

    return {
      user: {
        name: userData.display_name || userData.name || 'Anonymous User',
        avatar_url: userData.avatar_url,
      },
      items,
    };
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
