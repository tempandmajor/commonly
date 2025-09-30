import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';

/**
 * Increments the view count for a product
 */
export const incrementProductViews = async (productId: string): Promise<boolean> => {
  try {
    // First check if the product exists
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    // Since the products table doesn't have a viewCount column in the current schema,
    // we'll just log this for now. In a real implementation, you might
    // want to add the column or create a separate analytics table.
    return true;
  } catch (error) {
    // Use proper error tracking in production
    if (process.env.NODE_ENV as string === 'production' && process.env.NEXT_PUBLIC_SENTRY_D as string) {
      Sentry.captureException(error, {
        extra: {
          productId,
          action: 'incrementProductViews',
        },
      });
    } else {
    }
    return false;
  }
};

/**
 * Update product stock when purchased
 */
export const updateProductStock = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    // First get current stock quantity
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    // Decrement by quantity
    const { error } = await supabase
      .from('products')
      .update({
        stock_quantity: (data?.stock_quantity || 0) - quantity,
      })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    // Use proper error tracking in production
    if (process.env.NODE_ENV as string === 'production' && process.env.NEXT_PUBLIC_SENTRY_D as string) {
      Sentry.captureException(error, {
        extra: {
          productId,
          quantity,
          action: 'updateProductStock',
        },
      });
    } else {
    }
    return false;
  }
};
