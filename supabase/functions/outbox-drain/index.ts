// @ts-nocheck
import { createServiceSupabaseClient, corsHeaders, jsonResponse, formatError } from '../stripe-config.ts';

async function upsertUserWalletAccount(supabase: any, userId: string) {
  const { data } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('account_type', 'wallet')
    .single();
  if (data?.id) return data.id as string;
  const { data: inserted } = await supabase
    .from('ledger_accounts')
    .insert({ user_id: userId, account_type: 'wallet' })
    .select('id')
    .single();
  return inserted?.id as string;
}

async function getPlatformCashAccount(supabase: any) {
  const { data } = await supabase
    .from('ledger_accounts')
    .select('id')
    .is('user_id', null)
    .eq('account_type', 'platform_cash')
    .single();
  if (data?.id) return data.id as string;
  const { data: inserted } = await supabase
    .from('ledger_accounts')
    .insert({ user_id: null, account_type: 'platform_cash' })
    .select('id')
    .single();
  return inserted?.id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const cronKey = Deno.env.get('SUPABASE_CRON_KEY') || '';
    if (!cronKey || !authHeader.includes(cronKey)) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createServiceSupabaseClient();

    const { data: events, error } = await (supabase as any)
      .from('outbox_events')
      .select('id, event_type, payload, created_at, processed_at, attempts, next_attempt_at')
      .is('processed_at', null)
      .lte('next_attempt_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      return jsonResponse({ error: 'Failed to fetch outbox events' }, 500);
    }

    let processed = 0;
    let errors = 0;

    for (const evt of events || []) {
      let hadError = false;
      try {
        const payload = (evt.payload || {}) as any;

        // Analytics log
        try {
          await (supabase as any)
            .from('analytics_events')
            .insert({ event_type: evt.event_type, event_data: payload, user_id: (payload.user_id ?? null) });
        } catch (_e) {}

        const notif = async (userId: string, title: string, message: string, type: string, data: any) => {
          try {
            await (supabase as any)
              .from('notifications')
              .insert({ user_id: userId, title, message, type, data, read: false });
          } catch (_e) {}
          try {
            const email = data?.email as string | undefined;
            if (email) {
              await fetch('/functions/v1/email-sender', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email, subject: title, text: message, html: `<p>${message}</p>` })
              });
            }
          } catch (_e) {}
        };

        switch (evt.event_type) {
          case 'payment_method_added':
            if (payload.user_id) await notif(payload.user_id, 'Payment method added', 'A new payment method was added to your account.', 'payment', payload);
            break;
          case 'payment_method_removed':
            if (payload.user_id) await notif(payload.user_id, 'Payment method removed', 'A payment method was removed from your account.', 'payment', payload);
            break;
          case 'default_payment_method_set':
            if (payload.user_id) await notif(payload.user_id, 'Default payment method updated', 'Your default payment method was updated.', 'payment', payload);
            break;
          case 'setup_intent_created':
            break;
          case 'order_paid': {
            const sessionId = payload?.checkout_session_id as string | undefined;
            const userId = payload?.user_id as string | undefined;
            const amountTotal = payload?.amount_total as number | undefined;
            const addToWallet = payload?.metadata?.add_to_wallet === 'true';
            try {
              if (sessionId) {
                await (supabase as any)
                  .from('orders')
                  .update({ status: 'paid', updated_at: new Date().toISOString() })
                  .eq('checkout_session_id', sessionId);
              }
            } catch (_e) { hadError = true; }
            if (addToWallet && userId && typeof amountTotal === 'number') {
              try {
                // Record ledger: platform_cash -> user wallet
                const walletAccountId = await upsertUserWalletAccount(supabase, userId);
                const platformAccountId = await getPlatformCashAccount(supabase);
                const { data: tx } = await (supabase as any)
                  .from('ledger_transactions')
                  .insert({ reference: { source: 'order_paid', sessionId } })
                  .select('id')
                  .single();
                if (tx?.id) {
                  await (supabase as any).from('ledger_entries').insert([
                    { transaction_id: tx.id, account_id: platformAccountId, amount_cents: -amountTotal, description: 'Wallet top-up debit' },
                    { transaction_id: tx.id, account_id: walletAccountId, amount_cents: amountTotal, description: 'Wallet top-up credit' }
                  ]);
                }
                await (supabase as any).rpc('update_wallet_balance', { p_user_id: userId, p_amount_cents: amountTotal });
                try {
                  await (supabase as any).from('wallet_transactions').insert({ user_id: userId, amount_in_cents: amountTotal, type: 'credit', description: 'Wallet top-up via checkout' });
                } catch (_ee) {}
                await notif(userId, 'Wallet topped up', 'Your wallet has been credited from your recent payment.', 'wallet', { amount_total: amountTotal });
              } catch (_e) { hadError = true; }
            }
            if (userId) {
              try { await notif(userId, 'Payment received', 'Your payment was processed successfully.', 'payment', payload); } catch (_e) {}
            }
            break;
          }
          case 'order_refunded': {
            const sessionId = payload?.checkout_session_id as string | undefined;
            try {
              if (sessionId) {
                await (supabase as any)
                  .from('orders')
                  .update({ status: 'refunded', updated_at: new Date().toISOString() })
                  .eq('checkout_session_id', sessionId);
              }
            } catch (_e) { hadError = true; }
            const userId = payload?.user_id as string | undefined;
            if (userId) {
              try { await notif(userId, 'Order refunded', 'Your order was refunded. Funds will appear back in your account shortly.', 'payment', payload); } catch (_e) {}
            }
            break;
          }
          case 'stripe_event_processed':
            break;
          default:
            break;
        }

        if (!hadError) {
          await (supabase as any)
            .from('outbox_events')
            .update({ processed_at: new Date().toISOString(), attempts: (evt.attempts ?? 0) + 1 })
            .eq('id', evt.id);
          processed++;
        } else {
          errors++;
          const attempts = (evt.attempts ?? 0) + 1;
          if (attempts >= 5) {
            try {
              await (supabase as any).from('outbox_dead_letter').insert({ original_event_id: evt.id, event_type: evt.event_type, payload: evt.payload, attempt: attempts, error: 'Max attempts reached' });
            } catch (_e) {}
            await (supabase as any).from('outbox_events').update({ processed_at: new Date().toISOString(), attempts }).eq('id', evt.id);
          } else {
            const delaySeconds = Math.min(3600, Math.pow(2, attempts) * 10);
            const next = new Date(Date.now() + delaySeconds * 1000).toISOString();
            await (supabase as any)
              .from('outbox_events')
              .update({ attempts, next_attempt_at: next })
              .eq('id', evt.id);
          }
        }
      } catch (_e) {
        errors++;
      }
    }

    return jsonResponse({ success: true, processed, errors, fetched: (events || []).length });
  } catch (error) {
    return formatError(error as Error);
  }
}); 