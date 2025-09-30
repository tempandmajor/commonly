import { PurchaseProductParams } from '@/lib/types/order';
import { supabase } from '@/integrations/supabase/client';

// Create a simple product service function for validation
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

export const validatePurchase = async (
  params: PurchaseProductParams
): Promise<{
  isValid: boolean;
  error?: string;
}> => {
  try {
    const product = await getProductById(params.productId);

    if (!product) {
      return {
        isValid: false,
        error: 'Product not found',
      };
    }

    if (!product.inStock || product.stockQuantity < params.quantity) {
      return {
        isValid: false,
        error: 'Product out of stock or insufficient quantity',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate purchase',
    };
  }
};
