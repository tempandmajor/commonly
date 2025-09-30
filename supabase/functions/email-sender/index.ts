// @ts-nocheck
import { corsHeaders, jsonResponse, formatError } from '../stripe-config.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { to, subject, html, text } = await req.json();
    if (!to || !subject || (!html && !text)) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // Placeholder: send via external provider using a webhook/SMTP
    // If EMAIL_WEBHOOK_URL is set, POST the message
    const webhook = Deno.env.get('EMAIL_WEBHOOK_URL');
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text })
      });
    }

    // Always respond success (idempotent placeholder)
    return jsonResponse({ success: true });
  } catch (error) {
    return formatError(error as Error);
  }
}); 