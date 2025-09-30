// Deno Edge Function: scan-ticket
// Actions: mint (owner-only short-lived token) and scan (atomic validate+mark-used)
// Requires env: SUPABASE_URL, SUPABASE_ANON_KEY, SCAN_TICKET_SECRET

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Minimal JWT-like signer using HMAC-SHA256
const b64u = {
  enc: (b: Uint8Array) => btoa(String.fromCharCode(...b)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""),
  dec: (s: string) => Uint8Array.from(atob(s.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0)),
};

async function hmacSha256(key: CryptoKey, data: Uint8Array) {
  const sig = await crypto.subtle.sign({ name: "HMAC" }, key, data);
  return new Uint8Array(sig);
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signToken(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const hRaw = new TextEncoder().encode(JSON.stringify(header));
  const pRaw = new TextEncoder().encode(JSON.stringify(payload));
  const h = b64u.enc(hRaw);
  const p = b64u.enc(pRaw);
  const key = await importKey(secret);
  const sig = await hmacSha256(key, new TextEncoder().encode(`${h}.${p}`));
  const s = b64u.enc(sig);
  return `${h}.${p}.${s}`;
}

async function verifyToken(token: string, secret: string): Promise<{ valid: boolean; payload?: any; message?: string }>{
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return { valid: false, message: "Malformed token" };
    const key = await importKey(secret);
    const expected = await hmacSha256(key, new TextEncoder().encode(`${h}.${p}`));
    const sBytes = b64u.dec(s);
    if (sBytes.length !== expected.length || !expected.every((v, i) => v === sBytes[i])) {
      return { valid: false, message: "Bad signature" };
    }
    const payload = JSON.parse(new TextDecoder().decode(b64u.dec(p)));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return { valid: false, message: "Expired" };
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, message: "Token verify failed" };
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
  } as Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  const headers = corsHeaders(req);
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SECRET = Deno.env.get("SCAN_TICKET_SECRET");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ success: false, message: "Missing Supabase env" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }
    if (!SECRET) {
      return new Response(JSON.stringify({ success: false, message: "SCAN_TICKET_SECRET not set" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "No auth" }), { status: 401, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, message: "Auth failed" }), { status: 401, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const { action, ticketId, token, code, eventId } = await req.json().catch(() => ({}));

    if (action === "mint") {
      // Owner-only: ticket must belong to requester
      if (!ticketId) {
        return new Response(JSON.stringify({ success: false, message: "ticketId required" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
      }
      const { data, error } = await supabase
        .from("tickets")
        .select("id, user_id, event_id, status")
        .eq("id", ticketId)
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ success: false, message: "Ticket not found" }), { status: 404, headers: { ...headers, "Content-Type": "application/json" } });
      }
      if (data.user_id !== user.id) {
        return new Response(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403, headers: { ...headers, "Content-Type": "application/json" } });
      }
      if (data.status !== "active") {
        return new Response(JSON.stringify({ success: false, message: "Ticket not active" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
      }
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 5; // 5 min
      const payload = { tid: data.id, eid: data.event_id, uid: user.id, iat, exp };
      const signed = await signToken(payload, SECRET);
      return new Response(JSON.stringify({ success: true, token: signed }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }

    if (action === "scan") {
      // Role-based: admin/organizer/staff
      const roles: string[] = (user.user_metadata?.roles as string[]) || (user.app_metadata?.roles as string[]) || [];
      const allowed = roles.some(r => ["admin", "organizer", "staff"].includes(String(r).toLowerCase()));
      if (!allowed) {
        return new Response(JSON.stringify({ success: false, message: "Insufficient role" }), { status: 403, headers: { ...headers, "Content-Type": "application/json" } });
      }

      if (!eventId) {
        return new Response(JSON.stringify({ success: false, message: "eventId required" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
      }

      let ticket_id: string | null = null;
      if (token) {
        const verified = await verifyToken(token, SECRET);
        if (!verified.valid) {
          return new Response(JSON.stringify({ success: false, message: verified.message || "Bad token" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
        }
        if (verified.payload.eid !== eventId) {
          return new Response(JSON.stringify({ success: false, message: "Event mismatch" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
        }
        ticket_id = verified.payload.tid;
      } else if (code) {
        ticket_id = code;
      } else {
        return new Response(JSON.stringify({ success: false, message: "token or code required" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
      }

      // Atomic mark used if currently active and for the given event
      const { data: updated, error: updErr } = await supabase
        .from("tickets")
        .update({ status: "used", updated_at: new Date().toISOString() })
        .eq("id", ticket_id)
        .eq("event_id", eventId)
        .eq("status", "active")
        .select("id, event_id, user_id, ticket_type, price_in_cents, status, purchase_date, qr_code")
        .single();

      if (updErr || !updated) {
        return new Response(JSON.stringify({ success: false, message: "Invalid or already used" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
      }

      const ticket = {
        id: updated.id,
        eventId: updated.event_id,
        userId: updated.user_id,
        eventTitle: "Event",
        ticketType: updated.ticket_type,
        price: updated.price_in_cents / 100,
        status: updated.status as "active" | "used" | "cancelled",
        purchaseDate: updated.purchase_date,
        qrCode: updated.qr_code,
      };

      return new Response(JSON.stringify({ success: true, ticket, message: "Scanned" }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, message: "Unknown action" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e?.message || "Server error" }), { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
  }
});
