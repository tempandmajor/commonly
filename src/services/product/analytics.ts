import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';

/**
 * Track a product view and increment the view count in Supabase
 * @param productId The product ID to track
 * @returns Boolean indicating success or failure
 */
export const incrementProductViews = async (productId: string): Promise<boolean> => {
  try {
    // Don't increment view in development mode to avoid skewing data
    if (process.env.NODE_ENV as string === 'development') {
      return true;
    }

    // First get current view count
    const { data: product, error: getError } = await supabase
      .from('products')
      .select('views')
      .eq('id', productId)
      .single();

    if (getError) {
      Sentry.captureException(getError, {
        extra: { productId },
        tags: { action: 'increment_product_views' },
      });
      return false;
    }

    // Update the product views count by incrementing the current value
    const currentViews = product?.views || 0;
    const { error } = await supabase
      .from('products')
      .update({
        views: currentViews + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      Sentry.captureException(error, {
        extra: { productId },
        tags: { action: 'increment_product_views' },
      });
      return false;
    }

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { productId },
      tags: { action: 'increment_product_views' },
    });
    return false;
  }
};

/**
 * Track when a user adds a product to cart
 * @param productId The product ID added to cart
 * @param userId Optional user ID for the user who added to cart
 * @returns Boolean indicating success or failure
 */
export const trackAddToCart = async (productId: string, userId?: string): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV as string === 'development') {
      return true;
    }

    // First get current cart adds count
    const { data: product, error: getError } = await supabase
      .from('products')
      .select('cart_adds')
      .eq('id', productId)
      .single();

    if (getError) {
      Sentry.captureException(getError, {
        extra: { productId, userId },
        tags: { action: 'track_add_to_cart' },
      });
      return false;
    }

    // Update the product cart adds count by incrementing the current value
    const currentCartAdds = product?.cart_adds || 0;
    const { error } = await supabase
      .from('products')
      .update({
        cart_adds: currentCartAdds + 1,
        last_cart_add_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      Sentry.captureException(error, {
        extra: { productId, userId },
        tags: { action: 'track_add_to_cart' },
      });
      return false;
    }

    // If user ID is provided, log this to user analytics as well
    if (userId) {
      try {
        // Record user-specific product interest analytics in a separate try-catch
        // to avoid failing the main operation if this part fails
        const { error: interactionError } = await supabase
          .from('user_product_interactions' as const)
          .insert({
            user_id: userId,
            product_id: productId,
            action_type: 'cart_add',
            created_at: new Date().toISOString(),
          });

        if (interactionError) {
          Sentry.captureException(interactionError, {
            extra: { userId, productId },
            level: 'warning',
            tags: { action: 'user_product_interaction' },
          });
        }
      } catch (interactionErr) {}
    }

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { productId, userId },
      tags: { action: 'track_add_to_cart' },
    });
    return false;
  }
};

/**
 * Track when a user purchases a product
 * @param productId The product ID purchased
 * @param quantity The quantity purchased
 * @param userId Optional user ID for the user who made the purchase
 * @param orderAmount Optional amount in cents of the order
 * @returns Boolean indicating success or failure
 */
export const trackPurchase = async (
  productId: string,
  quantity: number = 1,
  userId?: string,
  orderAmount?: number
): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV as string === 'development') {
      return true;
    }

    // First get current product analytics data
    const { data: product, error: getError } = await supabase
      .from('products')
      .select('purchases, units_sold, revenue')
      .eq('id', productId)
      .single();

    if (getError) {
      Sentry.captureException(getError, {
        extra: { productId, quantity, userId, orderAmount },
        tags: { action: 'track_purchase' },
      });
      return false;
    }

    // Update multiple analytics columns in one operation
    const currentPurchases = product?.purchases || 0;
    const currentUnitsSold = product?.units_sold || 0;
    const currentRevenue = product?.revenue || 0;

    const { error } = await supabase
      .from('products')
      .update({
        purchases: currentPurchases + 1, // Increment purchase count
        units_sold: currentUnitsSold + quantity, // Add quantity to units sold
        revenue: currentRevenue + (orderAmount || 0), // Add to revenue
        last_purchased_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      Sentry.captureException(error, {
        extra: { productId, quantity, userId, orderAmount },
        tags: { action: 'track_purchase' },
      });
      return false;
    }

    // If user ID is provided, log this to user analytics as well
    if (userId) {
      try {
        // Record user-specific purchase analytics
        const { error: interactionError } = await supabase
          .from('user_product_interactions' as const)
          .insert({
            user_id: userId,
            product_id: productId,
            action_type: 'purchase',
            quantity,
            amount: orderAmount,
            created_at: new Date().toISOString(),
          });

        if (interactionError) {
          Sentry.captureException(interactionError, {
            extra: { userId, productId, quantity, orderAmount },
            level: 'warning',
            tags: { action: 'user_purchase_interaction' },
          });
        }
      } catch (interactionErr) {}
    }

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { productId, quantity, userId, orderAmount },
      tags: { action: 'track_purchase' },
    });
    return false;
  }
};

/**
 * Track when a product is shared
 * @param productId The product ID that was shared
 * @param platform The platform where the product was shared (e.g., 'twitter', 'facebook')
 * @param userId Optional user ID for the user who shared
 * @returns Boolean indicating success or failure
 */
export const trackShare = async (
  productId: string,
  platform: string,
  userId?: string
): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV as string === 'development') {
      return true;
    }

    // First get current shares count
    const { data: product, error: getError } = await supabase
      .from('products')
      .select('shares')
      .eq('id', productId)
      .single();

    if (getError) {
      Sentry.captureException(getError, {
        extra: { productId, platform, userId },
        tags: { action: 'track_share' },
      });
      return false;
    }

    // Update the product shares count
    const currentShares = product?.shares || 0;
    const { error } = await supabase
      .from('products')
      .update({
        shares: currentShares + 1,
        last_shared_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      Sentry.captureException(error, {
        extra: { productId, platform, userId },
        tags: { action: 'track_share' },
      });
      return false;
    }

    try {
      // Record detailed share analytics
      const { error: shareError } = await supabase.from('product_shares' as const).insert({
        product_id: productId,
        platform,
        user_id: userId || null,
        created_at: new Date().toISOString(),
        success: true,
      });

      if (shareError) {
        Sentry.captureException(shareError, {
          extra: { productId, platform, userId },
          level: 'warning',
          tags: { action: 'product_share_logging' },
        });
      }
    } catch (shareErr) {}

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { productId, platform, userId },
      tags: { action: 'track_share' },
    });
    return false;
  }
};
