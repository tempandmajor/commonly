import { PurchaseProductParams, PurchaseResult } from '@/lib/types/order';
import { validatePurchase } from './validation';
import { startStripeCheckout } from './checkout';
import { supabase } from '@/integrations/supabase/client';

// Simple product fetcher for purchase flow
const getProductById = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;

    if (data) {
      return {
        id: data.id,
        name: data.name,
        price: data.price_in_cents,
        stockQuantity: data.stock_quantity || 0,
        inStock: (data.stock_quantity || 0) > 0,
        status: data.status,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const purchaseProduct = async (params: PurchaseProductParams): Promise<PurchaseResult> => {
  try {
    // Validate the purchase
    const validation = await validatePurchase(params);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Ensure user is logged in to tie order to buyer
    const { data: auth } = await supabase.auth.getUser();
    const buyerId = auth.user?.id;
    if (!buyerId) {
      return { success: false, error: 'You must be logged in to purchase' };
    }

    // Create Stripe Checkout Session (destination charge to seller)
    const { url } = await startStripeCheckout(buyerId, params.productId, params.quantity);

    return {
      success: true,
      url,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to process purchase',
    };
  }
};
