// Order management service using the new orders table
import { Order } from '@/lib/types/order';
import { supabase } from '@/integrations/supabase/client';

export const fulfillOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        quantity: data.quantity,
        totalPrice: Number(data.total_price) as number,
        status: data.status,
        createdAt: data.created_at,
      } as Order;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const cancelOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        quantity: data.quantity,
        totalPrice: Number(data.total_price) as number,
        status: data.status,
        createdAt: data.created_at,
      } as Order;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const returnProduct = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'returned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        quantity: data.quantity,
        totalPrice: Number(data.total_price) as number,
        status: data.status,
        createdAt: data.created_at,
      } as Order;
    }

    return null;
  } catch (error) {
    return null;
  }
};
