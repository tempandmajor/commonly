import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import { initTracing } from './tracing';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

initTracing();

const app = Fastify({ logger: true });

const RATE_MAX = Number(process.env.BFF_RATE_LIMIT_MAX || 100);
const RATE_WINDOW = process.env.BFF_RATE_LIMIT_WINDOW || '1 minute';
await app.register(rateLimit, { max: RATE_MAX, timeWindow: RATE_WINDOW });

await app.register(swagger, {
  openapi: {
    info: { title: 'Commonly BFF', version: '0.1.0' }
  }
});
await app.register(swaggerUi, { routePrefix: '/docs' });

// Serve OpenAPI JSON
app.get('/openapi.json', async (_req, rep) => {
  try {
    // @ts-ignore - swagger() provided by plugin
    const spec = app.swagger();
    return rep.type('application/json').send(spec);
  } catch (e: any) {
    app.log.error(e);
    return rep.code(500).send({ error: 'Failed to generate OpenAPI' });
  }
});

const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = SUPABASE_PROJECT_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const JWKS_URL = `${SUPABASE_PROJECT_URL}/auth/v1/jwks`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

async function verifyAuth(authorization?: string) {
  if (!authorization) throw new Error('Missing Authorization');
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { payload } = await jwtVerify(token, JWKS, {});
  return payload as { sub?: string; role?: string };
}

function ensureTraceparentHeader() {
  const tid = Math.random().toString(16).slice(2).padEnd(32, '0');
  const sid = Math.random().toString(16).slice(2).padEnd(16, '0');
  return `00-${tid}-${sid}-01`;
}

function forwardHeaders(req: FastifyRequest) {
  const headers: Record<string, string> = {
    Authorization: (req.headers.authorization as string) || ''
  };
  headers['traceparent'] = (req.headers['traceparent'] as string) || ensureTraceparentHeader();
  const idem = req.headers['idempotency-key'] as string | undefined;
  if (idem) headers['idempotency-key'] = idem;
  return headers;
}

app.get('/health', {
  schema: {
    tags: ['meta'],
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } }
  }
}, async () => ({ ok: true }));

// Simple idempotency: cache POST /api/payments/methods and /checkout by idempotency-key header in-memory (per instance)
const idempotencyCache = new Map<string, any>();
app.addHook('preHandler', async (req, reply) => {
  if (req.method === 'POST' && (req.url === '/api/payments/methods' || req.url === '/api/payments/checkout')) {
    const key = (req.headers['idempotency-key'] as string | undefined) || '';
    if (!key) return;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from('idempotency_keys').select('response,status_code').eq('key', key).maybeSingle();
      if (data?.response) return reply.code((data as any).status_code ?? 200).send(data.response);
    } else if (idempotencyCache.has(key)) {
      const cached = idempotencyCache.get(key);
      return reply.code(200).send(cached);
    }
  }
});
app.addHook('onSend', async (req, reply, payload) => {
  if (req.method === 'POST' && (req.url === '/api/payments/methods' || req.url === '/api/payments/checkout')) {
    const key = (req.headers['idempotency-key'] as string | undefined) || '';
    if (key && reply.statusCode >= 200 && reply.statusCode < 300) {
      try {
        const json = typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (supabaseAdmin) {
          await supabaseAdmin.from('idempotency_keys').insert({ key, response: json, status_code: reply.statusCode } as any);
        } else {
          idempotencyCache.set(key, json);
        }
      } catch {}
    }
  }
});

// Payments: list payment methods
app.get('/api/payments/methods', {
  schema: {
    tags: ['payments'],
    response: {
      200: { type: 'object', properties: { paymentMethods: { type: 'array' } } }
    }
  },
  config: { rateLimit: { max: 60, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/payment-methods`, {
      method: 'GET',
      headers: forwardHeaders(req)
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(401).send({ error: 'Unauthorized' });
  }
});

// Payments: create setup intent
app.post('/api/payments/methods', {
  schema: {
    tags: ['payments'],
    response: {
      200: {
        type: 'object',
        properties: { client_secret: { type: 'string' }, setup_intent_id: { type: 'string' } }
      }
    }
  },
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/payment-methods`, {
      method: 'POST',
      headers: forwardHeaders(req)
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(401).send({ error: 'Unauthorized' });
  }
});

// Payments: verify payment intent
app.post('/api/payments/verify-intent', {
  schema: {
    tags: ['payments'],
    body: { type: 'object', properties: { payment_intent_id: { type: 'string' } }, required: ['payment_intent_id'] },
    response: { 200: { type: 'object' } }
  },
  config: { rateLimit: { max: 60, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/payment-handler`, {
      method: 'POST',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_payment', payment_intent_id: (req.body as any).payment_intent_id })
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ error: e?.message || 'Bad Request' });
  }
});

// Payments: create checkout session
app.post('/api/payments/checkout', {
  schema: {
    tags: ['payments'],
    response: { 200: { type: 'object' } }
  },
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ error: e?.message || 'Bad Request' });
  }
});

// Payments: set default method
const SetDefaultSchema = z.object({ paymentMethodId: z.string().min(1) });
app.post('/api/payments/set-default', {
  schema: {
    tags: ['payments'],
    body: { type: 'object', properties: { paymentMethodId: { type: 'string' } }, required: ['paymentMethodId'] },
    response: { 200: { type: 'object' } }
  },
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const parsed = SetDefaultSchema.parse(req.body);
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/payment-handler/set-default`, {
      method: 'POST',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId: parsed.paymentMethodId })
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ error: e?.message || 'Bad Request' });
  }
});

// Payments: delete method
app.delete('/api/payments/methods/:id', {
  schema: {
    tags: ['payments'],
    params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    response: { 200: { type: 'object' } }
  },
  config: { rateLimit: { max: 20, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const id = (req.params as { id: string }).id;
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/payment-methods`, {
      method: 'DELETE',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method_id: id })
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(401).send({ error: 'Unauthorized' });
  }
});

// Customer portal
app.post('/api/payments/customer-portal', {
  schema: {
    tags: ['payments'],
    response: { 200: { type: 'object' } }
  },
  config: { rateLimit: { max: 20, timeWindow: '1 minute' } }
}, async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await verifyAuth(req.headers.authorization as string | undefined);
    const resp = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/customer-portal`, {
      method: 'POST',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const data = await resp.json();
    return rep.code(resp.status).send(data);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ error: e?.message || 'Bad Request' });
  }
});

// Metrics: minimal ledger invariant checker (double-entry sum per transaction == 0)
app.get('/api/metrics/ledger-invariants', {
  schema: {
    tags: ['metrics'],
    response: {
      200: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          checked: { type: 'number' },
          violations: { type: 'number' }
        }
      }
    }
  }
}, async (_req, rep) => {
  if (!supabaseAdmin) return rep.code(503).send({ ok: false, checked: 0, violations: 0 });
  // Check last 200 transactions
  const { data: txs, error: err } = await supabaseAdmin
    .from('ledger_transactions')
    .select('id')
    .order('created_at', { ascending: false } as any)
    .limit(200);
  if (err || !txs) return rep.code(500).send({ ok: false, checked: 0, violations: 0 });
  let violations = 0;
  for (const tx of txs as { id: string }[]) {
    const { data: entries } = await supabaseAdmin
      .from('ledger_entries')
      .select('amount_cents')
      .eq('transaction_id', tx.id);
    const sum = (entries || []).reduce((acc: number, e: any) => acc + (e.amount_cents || 0), 0);
    if (sum !== 0) violations++;
  }
  return rep.send({ ok: violations === 0, checked: (txs as any[]).length, violations });
});

// Metrics: outbox counts
app.get('/api/metrics/outbox', {
  schema: {
    tags: ['metrics'],
    response: {
      200: {
        type: 'object',
        properties: {
          unprocessed: { type: 'number' },
          dlq: { type: 'number' }
        }
      }
    }
  }
}, async (_req, rep) => {
  if (!supabaseAdmin) return rep.code(503).send({ unprocessed: 0, dlq: 0 });
  const [{ data: unprocessed }] = await Promise.all([
    supabaseAdmin.from('outbox_events').select('id', { count: 'exact', head: true }).is('processed_at', null),
  ]);
  let dlq = 0;
  try {
    const { count } = await supabaseAdmin.from('outbox_dead_letter').select('id', { count: 'exact', head: true });
    dlq = count || 0;
  } catch {}
  const up = (unprocessed as any)?.count || 0;
  return rep.send({ unprocessed: up, dlq });
});

// Admin: platform settings - toggle waitlist
app.post('/api/admin/waitlist/toggle', {
  schema: {
    tags: ['admin'],
    body: { type: 'object', properties: { enabled: { type: 'boolean' } }, required: ['enabled'] },
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } }
  }
}, async (req, rep) => {
  try {
    const payload = await verifyAuth(req.headers.authorization as string | undefined);
    if (!payload?.sub) throw new Error('Unauthorized');
    if (!supabaseAdmin) return rep.code(503).send({ ok: false });
    const { data: user } = await supabaseAdmin.from('users').select('is_admin').eq('id', payload.sub as string).maybeSingle();
    if (!user?.is_admin) return rep.code(403).send({ ok: false });
    const enabled = (req.body as any).enabled as boolean;
    await supabaseAdmin.from('platform_settings').upsert({ key: 'waitlist_enabled', bool_value: enabled });
    return rep.send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ ok: false, error: e?.message });
  }
});

// Public: join waitlist
app.post('/api/waitlist/join', {
  schema: {
    tags: ['waitlist'],
    body: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] },
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } }
  }
}, async (req, rep) => {
  try {
    const email = ((req.body as any).email as string).trim().toLowerCase();
    if (!supabaseAdmin) return rep.code(503).send({ ok: false });
    const auth = await verifyAuth(req.headers.authorization as string | undefined).catch(() => ({}));
    const userId = (auth as any)?.sub || null;
    await supabaseAdmin.from('creator_waitlist').insert({ user_id: userId, email, status: 'pending' });
    return rep.send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ ok: false, error: e?.message });
  }
});

// Admin: list waitlist
app.get('/api/admin/waitlist', {
  schema: { tags: ['admin'], response: { 200: { type: 'array' } } }
}, async (req, rep) => {
  try {
    const payload = await verifyAuth(req.headers.authorization as string | undefined);
    if (!payload?.sub) throw new Error('Unauthorized');
    if (!supabaseAdmin) return rep.code(503).send([]);
    const { data: user } = await supabaseAdmin.from('users').select('is_admin').eq('id', payload.sub as string).maybeSingle();
    if (!user?.is_admin) return rep.code(403).send([]);
    const { data } = await supabaseAdmin.from('creator_waitlist').select('*').order('created_at', { ascending: false } as any);
    return rep.send(data || []);
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send([]);
  }
});

// Admin: approve/reject waitlist
app.post('/api/admin/waitlist/decision', {
  schema: {
    tags: ['admin'],
    body: { type: 'object', properties: { id: { type: 'string' }, approve: { type: 'boolean' }, notes: { type: 'string' } }, required: ['id','approve'] },
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } }
  }
}, async (req, rep) => {
  try {
    const payload = await verifyAuth(req.headers.authorization as string | undefined);
    if (!payload?.sub) throw new Error('Unauthorized');
    if (!supabaseAdmin) return rep.code(503).send({ ok: false });
    const { data: user } = await supabaseAdmin.from('users').select('is_admin').eq('id', payload.sub as string).maybeSingle();
    if (!user?.is_admin) return rep.code(403).send({ ok: false });
    const { id, approve, notes } = req.body as any;
    const status = approve ? 'approved' : 'rejected';
    const { data: wl } = await supabaseAdmin.from('creator_waitlist').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle();
    if (approve && wl?.user_id) {
      await supabaseAdmin.from('users').update({ can_create_events: true }).eq('id', wl.user_id);
    }
    return rep.send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ ok: false, error: e?.message });
  }
});

// Creators/Admin: create invite
app.post('/api/invites/create', {
  schema: {
    tags: ['invites'],
    body: { type: 'object', properties: { email: { type: 'string' }, expiresInHours: { type: 'number' } }, required: ['email'] },
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, token: { type: 'string' } } } }
  }
}, async (req, rep) => {
  try {
    const payload = await verifyAuth(req.headers.authorization as string | undefined);
    if (!payload?.sub) throw new Error('Unauthorized');
    if (!supabaseAdmin) return rep.code(503).send({ ok: false });
    const inviter = payload.sub as string;
    const { data: user } = await supabaseAdmin.from('users').select('is_admin, can_create_events').eq('id', inviter).maybeSingle();
    if (!user?.is_admin && !user?.can_create_events) return rep.code(403).send({ ok: false });
    const email = ((req.body as any).email as string).trim().toLowerCase();
    const hours = Number((req.body as any).expiresInHours) || 168;
    const expires = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await supabaseAdmin.from('creator_invites').insert({ inviter_user_id: inviter, invitee_email: email, token, expires_at: expires });
    return rep.send({ ok: true, token });
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ ok: false, error: e?.message });
  }
});

// Public: accept invite
app.post('/api/invites/accept', {
  schema: {
    tags: ['invites'],
    body: { type: 'object', properties: { token: { type: 'string' } }, required: ['token'] },
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } }
  }
}, async (req, rep) => {
  try {
    const payload = await verifyAuth(req.headers.authorization as string | undefined);
    if (!payload?.sub) throw new Error('Unauthorized');
    if (!supabaseAdmin) return rep.code(503).send({ ok: false });
    const token = (req.body as any).token as string;
    const userId = payload.sub as string;
    const now = new Date().toISOString();
    const { data: inv } = await supabaseAdmin
      .from('creator_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();
    if (!inv) return rep.code(400).send({ ok: false, error: 'Invalid invite' });
    if (inv.expires_at && inv.expires_at < now) {
      await supabaseAdmin.from('creator_invites').update({ status: 'expired' }).eq('id', inv.id);
      return rep.code(400).send({ ok: false, error: 'Invite expired' });
    }
    await supabaseAdmin.from('creator_invites').update({ status: 'accepted', accepted_user_id: userId, accepted_at: now }).eq('id', inv.id);
    await supabaseAdmin.from('users').update({ can_create_events: true }).eq('id', userId);
    return rep.send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return rep.code(400).send({ ok: false, error: e?.message });
  }
});

export default app; 