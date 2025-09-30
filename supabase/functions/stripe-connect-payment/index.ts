import { createSupabaseClient, COLLECTIONS, formatError } from '../stripe-config.ts';
import { stripe } from '../stripe/config.ts';
import { createOrRetrieveStripeCustomer } from '../stripe/utils/customer-utils.ts';

// Platform fee configuration - now supports Creator Program
const PLATFORM_FEE_PERCENT = 20; // Default for regular users (20%)
const CREATOR_PROGRAM_FEE_PERCENT = 15; // Reduced fee for Creator Program members (15%)

// Define the Supabase Edge Function for Stripe Connect payments
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get the request data and user authentication
    const supabase = createSupabaseClient(req);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    // Check authentication
    if (authError || !session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;
    const email = session.user.email;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const { 
      amount, 
      currency = 'usd', 
      paymentMethodId, 
      creatorId,
      applicationFeeAmount,
      metadata = {},
      description = 'Payment'
    } = await req.json();
    
    // Validate required fields
    if (!amount || !paymentMethodId || !creatorId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, paymentMethodId, creatorId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get or create customer
    const customerId = await createOrRetrieveStripeCustomer(req, userId, email);
    
    // Get creator's connected account ID and check Creator Program status
    const { data: creatorData, error: creatorError } = await supabase
      .from(COLLECTIONS.USERS)
      .select('stripe_connect_account_id')
      .eq('id', creatorId)
      .single();
    
    if (creatorError || !creatorData?.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ error: 'Creator Stripe Connect account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if creator is in Creator Program
    const { data: creatorProgramData } = await supabase
      .from('creator_program')
      .select('status')
      .eq('user_id', creatorId)
      .eq('status', 'approved')
      .maybeSingle();

    const isCreatorProgram = !!creatorProgramData;
    const platformFeePercent = isCreatorProgram ? CREATOR_PROGRAM_FEE_PERCENT : PLATFORM_FEE_PERCENT;
    
    // Calculate platform fee if not provided, using Creator Program status
    const platformFeeAmount = applicationFeeAmount || Math.round((amount * 100) * (platformFeePercent / 100));
    
    // Create a payment intent with the connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      application_fee_amount: platformFeeAmount,
      metadata: {
        ...metadata,
        userId,
        creatorId,
        platformFeePercent: platformFeePercent.toString(),
        isCreatorProgram: isCreatorProgram.toString(),
        originalAmount: amount.toString(),
        description
      },
      transfer_data: {
        destination: creatorData.stripe_connect_account_id,
      }
    });
    
    // Calculate amounts for response
    const platformFeeInDollars = platformFeeAmount / 100;
    const creatorEarnings = amount - platformFeeInDollars;
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: amount,
        platformFee: platformFeeInDollars,
        platformFeePercent: platformFeePercent,
        creatorEarnings: creatorEarnings,
        isCreatorProgram: isCreatorProgram,
        currency: currency.toUpperCase(),
        metadata: {
          ...metadata,
          processed_at: new Date().toISOString(),
          creatorProgramBenefit: isCreatorProgram ? `${PLATFORM_FEE_PERCENT - CREATOR_PROGRAM_FEE_PERCENT}% savings` : null
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    
    return formatError(error);
  }
}); 