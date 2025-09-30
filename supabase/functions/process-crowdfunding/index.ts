import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // This function processes all-or-nothing events
    // It should be called periodically (e.g., every hour) by a cron job
    
    const now = new Date();
    
    
    // Find all-or-nothing events that need processing
    const { data: eventsToProcess, error } = await supabase
      .from('events')
      .select(`
        id, 
        title, 
        target_amount, 
        current_amount, 
        pledge_deadline, 
        funding_status,
        reserved_tickets,
        available_tickets,
        tickets_sold
      `)
      .eq('is_all_or_nothing', true)
      .eq('funding_status', 'in_progress')
      .or(`pledge_deadline.lte.${now.toISOString()},current_amount.gte.target_amount`);

    if (error) {
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!eventsToProcess || eventsToProcess.length === 0) {
      
      return new Response(
        JSON.stringify({ message: 'No events to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const event of eventsToProcess) {
      try {
        await processEvent(event, supabase);
        processedCount++;
      } catch (error) {
        console.error('process-crowdfunding: error processing event', { eventId: (event as Record<string, unknown>).id, error });
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Processing complete',
        processed: processedCount,
        errors: errorCount,
        total: eventsToProcess.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('process-crowdfunding: top-level error', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process a single all-or-nothing event
 */
type SupabaseTableQuery = {
  update: (values: unknown) => SupabaseTableQuery;
  eq: (field: string, value: unknown) => SupabaseTableQuery;
};

type SupabaseLike = {
  from: (table: string) => SupabaseTableQuery & Promise<{ data?: unknown; error?: unknown }>;
};

async function processEvent(event: Record<string, unknown>, supabase: SupabaseLike) {
  const e = event as {
    id: string;
    current_amount?: number;
    target_amount?: number;
    pledge_deadline?: string;
    reserved_tickets?: number;
    tickets_sold?: number;
    available_tickets?: number;
  };
  const goalReached = (e.current_amount || 0) >= (e.target_amount || 0);
  const deadlinePassed = e.pledge_deadline && new Date(e.pledge_deadline) <= new Date();

  
  
  

  if (goalReached) {
    // Goal reached - mark as funded
    await handleSuccessfulFunding(e, supabase);
  } else if (deadlinePassed) {
    // Deadline passed without reaching goal - mark as failed
    await handleFailedFunding(e, supabase);
  }
}

/**
 * Handle successful funding (goal reached)
 */
async function handleSuccessfulFunding(event: {
  id: string;
  reserved_tickets?: number;
  tickets_sold?: number;
}, supabase: SupabaseLike) {
  

  // Update event status to funded
  const { error: updateError } = await supabase
    .from('events')
    .update({
      funding_status: 'funded',
      funded_at: new Date().toISOString()
    })
    .eq('id', event.id);

  if (updateError) {
    console.error('process-crowdfunding: update funded status error', updateError);
    throw updateError;
  }

  // Convert reserved tickets to sold tickets
  if (event.reserved_tickets && event.reserved_tickets > 0) {
    const { error: ticketError } = await supabase
      .from('events')
      .update({
        reserved_tickets: 0,
        tickets_sold: (event.tickets_sold || 0) + event.reserved_tickets
      })
      .eq('id', event.id);

    if (ticketError) {
      console.error('process-crowdfunding: ticket conversion error', ticketError);
    }
  }

  // Update all pledges to succeeded status
  const { error: pledgeError } = await supabase
    .from('pledges')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('event_id', event.id)
    .eq('status', 'requires_capture');

  if (pledgeError) {
    console.error('process-crowdfunding: pledge status update error (succeeded)', pledgeError);
  }

  
}

/**
 * Handle failed funding (deadline passed without reaching goal)
 */
async function handleFailedFunding(event: {
  id: string;
  reserved_tickets?: number;
  available_tickets?: number;
}, supabase: SupabaseLike) {
  

  // Update event status to funding_failed
  const { error: updateError } = await supabase
    .from('events')
    .update({
      funding_status: 'funding_failed'
    })
    .eq('id', event.id);

  if (updateError) {
    console.error('process-crowdfunding: update failed status error', updateError);
    throw updateError;
  }

  // Release reserved tickets back to available
  if (event.reserved_tickets && event.reserved_tickets > 0) {
    const { error: ticketError } = await supabase
      .from('events')
      .update({
        available_tickets: (event.available_tickets || 0) + event.reserved_tickets,
        reserved_tickets: 0
      })
      .eq('id', event.id);

    if (ticketError) {
      console.error('process-crowdfunding: ticket release error', ticketError);
    }
  }

  // Update all pledges to canceled status
  const { error: pledgeError } = await supabase
    .from('pledges')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('event_id', event.id)
    .eq('status', 'requires_capture');

  if (pledgeError) {
    console.error('process-crowdfunding: pledge status update error (canceled)', pledgeError);
  }

  
}
 