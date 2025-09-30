// Stock update service using the new stock_quantity column
import { supabase } from '@/integrations/supabase/client';

export const updateProductStock = async (
  productId: string,
  currentStock: number,
  quantity: number
): Promise<boolean> => {
  try {
    const newStock = currentStock - quantity;

    const { error } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) throw error;

    return true;
  } catch (error) {
    return false;
  }
};
