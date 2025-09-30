const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-printify-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { createSupabaseClient, formatError } from './stripe-config.ts';

// Hex helper
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Simple helper to verify webhook signature if secret is provided
async function verifySignature(req: Request, bodyText: string): Promise<boolean> {
  const secret = Deno.env.get('PRINTIFY_WEBHOOK_SECRET');
  const signature = req.headers.get('x-printify-signature');
  if (!secret || !signature) return true; // allow if not configured yet
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
    const calc = toHex(new Uint8Array(sigBuf));
    // Printify sends lowercase hex signature
    return safeEqual(signature, calc);
  } catch (_e) {
    // If any error, do not block webhook to avoid delivery issues during setup
    return true;
  }
}

// Map Printify status to our fulfillment_status and optional shipped timestamp
function mapStatus(evtType: string): { status?: string; setShippedAt?: boolean } {
  switch (evtType) {
    case 'order:created':
      return { status: 'created' };
    case 'order:accepted':
      return { status: 'accepted' };
    case 'order:sent_to_production':
    case 'order:in_production':
      return { status: 'in_production' };
    case 'order:printed':
      return { status: 'printed' };
    case 'order:shipped':
      return { status: 'shipped', setShippedAt: true };
    case 'order:canceled':
    case 'order:cancelled':
      return { status: 'cancelled' };
    default:
      return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const bodyText = await req.text();
    const valid = await verifySignature(req, bodyText);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Re-parse JSON after reading text
    let payload: any = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_e) {}

    const eventType: string = payload?.event || payload?.type || '';
    const data = payload?.data || payload;
    // We sent external_id in create call as our order.id
    const externalId: string | undefined = data?.external_id || data?.order?.external_id;
    const trackingNumber: string | undefined = data?.tracking_number || data?.shipment?.tracking_number;
    const carrier: string | undefined = data?.carrier || data?.shipment?.carrier;
    const trackingUrl: string | undefined = data?.tracking_url || data?.shipment?.tracking_url;
    const printifyOrderId: string | undefined = data?.id || data?.order_id || data?.order?.id;

    const supabase = createSupabaseClient(req) as any;

    if (!externalId) {
      // Nothing to map; ack
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { status: mappedStatus, setShippedAt } = mapStatus(eventType);

    const update: Record<string, unknown> = {
      fulfillment_ref: printifyOrderId ?? null,
    };
    if (mappedStatus) update.fulfillment_status = mappedStatus;
    if (trackingNumber) update.tracking_number = trackingNumber;
    if (carrier) update.carrier = carrier;
    if (trackingUrl) update.tracking_url = trackingUrl;
    if (setShippedAt) update.shipped_at = new Date().toISOString();

    await supabase
      .from('orders')
      .update(update)
      .eq('id', externalId);

    // Insert analytics event for fulfillment milestone
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'fulfillment_milestone',
          event_data: { event: eventType, order_id: externalId, ...update },
          user_id: null,
          session_id: null,
        });
    } catch (_e) {}

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return formatError(error as Error);
  }
});
