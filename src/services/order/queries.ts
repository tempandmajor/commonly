// Order queries service using the new orders table
import { Order } from '@/lib/types/order';
import { supabase } from '@/integrations/supabase/client';

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      productId: item.product_id,
      quantity: item.quantity,
      totalPrice: Number(item.total_price) as number,
      status: item.status as Order['status'],
      createdAt: item.created_at,
    }));
  } catch (error) {
    return [];
  }
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      productId: item.product_id,
      quantity: item.quantity,
      totalPrice: Number(item.total_price) as number,
      status: item.status as Order['status'],
      createdAt: item.created_at,
    }));
  } catch (error) {
    return [];
  }
};
