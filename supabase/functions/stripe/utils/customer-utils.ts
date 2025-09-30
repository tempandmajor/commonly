import { createSupabaseClient, COLLECTIONS } from "../../stripe-config.ts";
import { stripe } from "../config.ts";

/**
 * Get Stripe customer ID for a given user
 */
export const getStripeCustomerId = async (req: Request, userId: string): Promise<string | null> => {
  const supabase = createSupabaseClient(req);
  
  try {
    // Check if the user already has a Stripe customer ID
    const { data, error } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    
    return data?.stripe_customer_id || null;
  } catch (error) {
    console.error('getStripeCustomerId error', error);
    return null;
  }
};

/**
 * Create a new Stripe customer or retrieve existing one
 */
export const createOrRetrieveStripeCustomer = async (
  req: Request,
  userId: string,
  email: string
): Promise<string> => {
  const supabase = createSupabaseClient(req);
  
  try {
    // Check if customer exists already
    const existingCustomerId = await getStripeCustomerId(req, userId);
    if (existingCustomerId) return existingCustomerId;

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Store the mapping in Supabase
    await supabase.from(COLLECTIONS.CUSTOMERS).insert({
      user_id: userId,
      stripe_customer_id: customer.id,
      email: email,
      created_at: new Date().toISOString(),
    });

    return customer.id;
  } catch (error) {
    console.error('createOrRetrieveStripeCustomer error', error);
    throw error;
  }
};
