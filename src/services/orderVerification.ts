// Order verification service using the new orders table
import { Order } from '@/lib/types/order';
import { supabase } from '@/integrations/supabase/client';

export const checkOrderStatus = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();

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

export const getOrderBySessionId = async (sessionId: string): Promise<Order | null> => {
  try {
    // In a real implementation, you'd have a session_id column in orders table
    // For now, we'll use the order ID as session ID
    const { data, error } = await supabase.from('orders').select('*').eq('id', sessionId).single();

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

export const verifyOrder = async (
  sessionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const order = await getOrderBySessionId(sessionId);
    return {
      success: !!order,
      error: order ? undefined : 'Order not found',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify order',
    };
  }
};
