import { createSupabaseClient, formatError } from '../stripe-config.ts';
import { stripe } from '../stripe/config.ts';
import { createOrRetrieveStripeCustomer } from '../stripe/utils/customer-utils.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Platform fee configuration with Creator Program support
const PLATFORM_FEE_PERCENT = 20; // Default for regular users (20%)
const CREATOR_PROGRAM_FEE_PERCENT = 15; // Reduced fee for Creator Program members (15%)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.endsWith('/create-pledge')) {
      return await handleCreatePledge(req);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return formatError(error as Error);
  }
});

/**
 * Create a new pledge for an event
 */
async function handleCreatePledge(req: Request) {
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
      eventId, 
      amount, 
      currency = 'usd', 
      paymentMethodId, 
      _eventTitle,
      eventOrganizerId 
    } = await req.json();
    
    // Validate required fields
    if (!eventId || !amount || !paymentMethodId || !eventOrganizerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get or create customer
    const customerId = await createOrRetrieveStripeCustomer(req, userId, email);
    
    // Get organizer's connected account ID
    const { data: organizerData, error: organizerError } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', eventOrganizerId)
      .single();
    
    if (organizerError || !organizerData?.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ error: 'Event organizer account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get event details to check creator's program status
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('creator_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    // Check if event creator is in Creator Program
    const { data: creatorProgramData } = await supabase
      .from('creator_program')
      .select('status')
      .eq('user_id', event.creator_id)
      .eq('status', 'approved')
      .maybeSingle();

    const isCreatorProgram = !!creatorProgramData;
    const platformFeePercent = isCreatorProgram ? CREATOR_PROGRAM_FEE_PERCENT : PLATFORM_FEE_PERCENT;

    // Create a payment intent with manual capture for all-or-nothing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: 'manual', // Don't capture until goal is reached
      confirmation_method: 'manual',
      confirm: true,
      application_fee_amount: Math.round((amount * 100) * (platformFeePercent / 100)), // Dynamic platform fee
      metadata: {
        eventId,
        userId,
        pledgeType: 'event',
        platformFee: `${platformFeePercent}%`,
        isAllOrNothing: 'true',
        isCreatorProgram: isCreatorProgram.toString(),
        creatorProgramBenefit: isCreatorProgram ? `${PLATFORM_FEE_PERCENT - CREATOR_PROGRAM_FEE_PERCENT}% savings vs regular users` : null
      },
      transfer_data: {
        destination: organizerData.stripe_connect_account_id,
      }
    });
    
    // Create pledge record in Supabase
    const { data: pledgeData, error: pledgeError } = await supabase
      .from('pledges')
      .insert({
        user_id: userId,
        event_id: eventId,
        amount,
        currency,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status === 'requires_capture' ? 'requires_capture' : paymentIntent.status,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (pledgeError) {
      
      // Even if DB record fails, the payment went through, so we return success
    }

    // Update event funding progress
    if (paymentIntent.status === 'requires_capture') {
      try {
        // Call the funding progress update function
        // In a real implementation, this would be imported from the backend service
        const { data: currentEvent, error: eventError } = await supabase
          .from('events')
          .select('current_amount')
          .eq('id', eventId)
          .single();

        if (!eventError && currentEvent) {
          const newAmount = (currentEvent.current_amount || 0) + amount;
          
          await supabase
            .from('events')
            .update({
              current_amount: newAmount
            })
            .eq('id', eventId);
          
          
        }
      } catch (error) {
        console.error('pledge-functions: update event funding progress error', error);
        // Don't fail the pledge creation for this
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        pledgeId: pledgeData?.id,
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        clientSecret: paymentIntent.client_secret,
        platformFeePercent: platformFeePercent,
        isCreatorProgram: isCreatorProgram,
        creatorProgramBenefit: isCreatorProgram ? `${PLATFORM_FEE_PERCENT - CREATOR_PROGRAM_FEE_PERCENT}% savings vs regular users` : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return formatError(error as Error);
  }
}

/**
 * Cancel an existing pledge
 */
async function _handleCancelPledge(req: Request) {
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
    
    // Parse the request body
    const { pledgeId } = await req.json();
    
    if (!pledgeId) {
      return new Response(
        JSON.stringify({ error: 'Pledge ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get pledge record to find payment intent
    const { data: pledgeData, error: pledgeError } = await supabase
      .from('pledges')
      .select('payment_intent_id, status')
      .eq('id', pledgeId)
      .eq('user_id', userId) // Ensure user owns this pledge
      .single();
    
    if (pledgeError || !pledgeData) {
      return new Response(
        JSON.stringify({ error: 'Pledge not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // If payment is already completed, we can't cancel it
    if (['succeeded', 'canceled'].includes(pledgeData.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot cancel pledge with status ${pledgeData.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Cancel the payment intent in Stripe
    const cancelledPaymentIntent = await stripe.paymentIntents.cancel(
      pledgeData.payment_intent_id
    );
    
    // Update pledge status in Supabase
    await supabase
      .from('pledges')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pledgeId);
    
    return new Response(
      JSON.stringify({
        success: true,
        status: 'canceled',
        paymentIntentId: cancelledPaymentIntent.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return formatError(error as Error);
  }
}

/**
 * Check status of an existing pledge
 */
async function _handleCheckPledgeStatus(req: Request) {
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
    
    // Get query params
    const url = new URL(req.url);
    const pledgeId = url.searchParams.get('pledgeId');
    const eventId = url.searchParams.get('eventId');
    
    if (!pledgeId && !eventId) {
      return new Response(
        JSON.stringify({ error: 'Either pledgeId or eventId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Query based on available parameters
    let query = supabase.from('pledges').select('*');
    
    if (pledgeId) {
      query = query.eq('id', pledgeId);
    } else if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    // Always filter by user ID for security
    query = query.eq('user_id', userId);
    
    const { data: pledges, error: pledgeError } = await query;
    
    if (pledgeError) {
      return new Response(
        JSON.stringify({ error: 'Error retrieving pledges' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // If no pledges found
    if (!pledges || pledges.length === 0) {
      return new Response(
        JSON.stringify({ 
          hasPledges: false,
          pledges: [] 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        hasPledges: true,
        pledges: pledges
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return formatError(error);
  }
}
