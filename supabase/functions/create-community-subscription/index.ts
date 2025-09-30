import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Platform fee configuration with Creator Program support
const PLATFORM_FEE_PERCENT = 20; // Default for regular users (20%)
const CREATOR_PROGRAM_FEE_PERCENT = 15; // Reduced fee for Creator Program members (15%)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, priceId, amount } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Extract community ID from price ID
    const communityId = priceId.split('_')[1] // Format: community_{communityId}_{monthly|yearly}
    const subscriptionType = priceId.split('_')[2]

    // Get community details and subscription settings
    const { data: community, error: communityError } = await supabaseClient
      .from('communities')
      .select('subscription_settings, creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      throw new Error('Community not found')
    }

    const subscriptionSettings = community.subscription_settings
    if (!subscriptionSettings?.enabled) {
      throw new Error('Community subscriptions are not enabled')
    }

    // Check if community creator is in Creator Program
    const { data: creatorProgramData } = await supabaseClient
      .from('creator_program')
      .select('status')
      .eq('user_id', community.creator_id)
      .eq('status', 'approved')
      .maybeSingle();

    const isCreatorProgram = !!creatorProgramData;
    const platformFeePercent = isCreatorProgram ? CREATOR_PROGRAM_FEE_PERCENT : PLATFORM_FEE_PERCENT;

    // Create or get Stripe customer
    let customer
    try {
      customer = await stripe.customers.retrieve(customerId)
    } catch (error) {
      console.error('Error in create-community-subscription', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return new Response(
        JSON.stringify({ error: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Create new customer if not found
    if (!customer) {
      customer = await stripe.customers.create({
        id: customerId,
        metadata: {
          supabase_user_id: customerId
        }
      })
    }

    // Create Stripe price for the community subscription
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: subscriptionType === 'yearly' ? 'year' : 'month',
      },
      product_data: {
        name: `${subscriptionSettings.recurringEvent.title} - ${subscriptionType} subscription`,
        description: subscriptionSettings.recurringEvent.description,
        metadata: {
          community_id: communityId,
          subscription_type: subscriptionType,
          creator_program_status: isCreatorProgram.toString(),
        }
      },
      metadata: {
        community_id: communityId,
        subscription_type: subscriptionType,
        creator_program_status: isCreatorProgram.toString(),
      }
    })

    // Calculate platform fee based on Creator Program status
    const applicationFeeAmount = Math.round((amount * 100) * (platformFeePercent / 100))

    // Create Stripe subscription with dynamic platform fee
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: stripePrice.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      application_fee_percent: platformFeePercent,
      metadata: {
        community_id: communityId,
        subscription_type: subscriptionType,
        supabase_user_id: customerId,
        creator_program_status: isCreatorProgram.toString(),
        platform_fee_percent: platformFeePercent.toString(),
        creator_program_benefit: isCreatorProgram ? `${PLATFORM_FEE_PERCENT - CREATOR_PROGRAM_FEE_PERCENT}% savings` : null,
      },
      // Transfer to community creator's Connect account (if they have one)
      // transfer_data: {
      //   destination: community.creator_stripe_account_id,
      // },
    })

    // Store subscription in database with Creator Program information
    const { error: dbError } = await supabaseClient
      .from('community_subscribers')
      .insert({
        user_id: customerId,
        community_id: communityId,
        subscription_type: subscriptionType,
        status: 'active',
        start_date: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + (subscriptionType === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
        stripe_subscription_id: subscription.id,
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      throw dbError
    }

    // Calculate creator earnings
    const platformFeeInDollars = applicationFeeAmount / 100;
    const creatorEarnings = amount - platformFeeInDollars;

    // Safely derive client secret from expanded latest invoice
    const latest = subscription.latest_invoice as Stripe.Invoice | string | null
    const clientSecret = (typeof latest === 'object' && latest !== null && 'payment_intent' in latest)
      ? (latest.payment_intent as Stripe.PaymentIntent).client_secret
      : null

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret,
        status: subscription.status,
        platformFee: platformFeeInDollars,
        platformFeePercent: platformFeePercent,
        creatorEarnings: creatorEarnings,
        isCreatorProgram: isCreatorProgram,
        creatorProgramBenefit: isCreatorProgram ? `${PLATFORM_FEE_PERCENT - CREATOR_PROGRAM_FEE_PERCENT}% savings vs regular users` : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-community-subscription', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})