import { supabase } from '@/integrations/supabase/client';

export const handlePaymentWebhook = async (eventData: {
  payment_id: string;
  status: string;
  metadata?: Record<string, unknown>;
}) => {
  try {
    const { payment_id, status } = eventData;

    // Update payment status in database
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      throw paymentError;
    }

    // If payment succeeded, handle fulfillment
    if (status === 'succeeded' || status === 'completed') {
      await handlePaymentSuccess(payment_id);
    } else if (status === 'failed' || status === 'canceled') {
      await handlePaymentFailure(payment_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Payment webhook error:', error);
    return { success: false, error };
  }
};

export const handleStripeWebhook = async (stripeEvent: {
  type: string;
  data: {
    object: {
      id: string;
      status?: string;
      amount?: number;
      currency?: string;
      customer?: string;
      metadata?: Record<string, unknown>;
    };
  };
}) => {
  try {
    const { type, data } = stripeEvent;
    const paymentObject = data.object;

    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded({
          id: paymentObject.id,
          data: { object: paymentObject },
        });
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed({
          id: paymentObject.id,
          data: { object: paymentObject },
        });
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted({
          id: paymentObject.id,
          data: { object: paymentObject },
        });
        break;
      default:
        console.log(`Unhandled Stripe event type: ${type}`);
    }

    // Update or create payment record
    const { error } = await supabase.from('payments').upsert(
      {
        stripe_payment_id: paymentObject.id,
        amount_in_cents: paymentObject.amount || 0,
        status: paymentObject.status || 'pending',
        payment_method: 'stripe',
        description: `Stripe ${type}`,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'stripe_payment_id',
      }
    );

    if (error) {
      console.error('Error updating Stripe payment:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return { success: false, error };
  }
};

export async function handlePaymentIntentSucceeded(event: {
  id: string;
  data: { object: Record<string, unknown> };
}): Promise<void> {
  const paymentIntent = event.data.object;

  try {
    // Update payment record status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_id', paymentIntent.id as string);

    if (paymentError) {
      console.error('Error updating payment intent:', paymentError);
      throw paymentError;
    }

    // Trigger fulfillment if this is for an order
    const metadata = paymentIntent.metadata as Record<string, unknown>;
    if (metadata?.order_id) {
      await fulfillOrder(String(metadata.order_id));
    }

    console.log(`Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

export async function handlePaymentIntentFailed(event: {
  id: string;
  data: { object: Record<string, unknown> };
}): Promise<void> {
  const paymentIntent = event.data.object;

  try {
    // Update payment record status
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_id', paymentIntent.id as string);

    if (error) {
      console.error('Error updating failed payment:', error);
      throw error;
    }

    console.log(`Payment failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

export async function handleCheckoutSessionCompleted(event: {
  id: string;
  data: { object: Record<string, unknown> };
}): Promise<void> {
  const session = event.data.object;

  try {
    const metadata = session.metadata as Record<string, unknown>;

    // Create order record if it doesn't exist
    if (metadata?.product_id && metadata?.user_id) {
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: String(metadata.user_id) as string,
        product_id: String(metadata.product_id) as string,
        quantity: Number(metadata.quantity) as number || 1,
        total_price: Number(session.amount_total || 0) as number / 100, // Convert from cents
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }
    }

    console.log(`Checkout completed: ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

// Helper functions
async function handlePaymentSuccess(paymentId: string) {
  try {
    // Get the payment details
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      console.error('Error fetching payment:', error);
      return;
    }

    console.log(`Payment ${paymentId} processed successfully`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentId: string) {
  try {
    console.log(`Payment ${paymentId} failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function fulfillOrder(orderId: string) {
  try {
    // Update order status to fulfilled
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error fulfilling order:', error);
      throw error;
    }

    console.log(`Order ${orderId} fulfilled`);
  } catch (error) {
    console.error('Error in order fulfillment:', error);
    throw error;
  }
}
