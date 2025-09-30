import { createSupabaseClient, formatError } from "./stripe-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Very lightweight types to avoid coupling
type SupabaseQuery = {
  select: (...args: unknown[]) => SupabaseQuery & Promise<{ data?: any; error?: any }>;
  update: (values: Record<string, unknown>) => SupabaseQuery & Promise<{ data?: any; error?: any }>;
  eq: (field: string, value: unknown) => SupabaseQuery;
  single: () => Promise<{ data?: any; error?: any }>;
};

type SupabaseLike = {
  from: (table: string) => SupabaseQuery;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req) as unknown as SupabaseLike;
    const apiKey = Deno.env.get("PRINTIFY_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "PRINTIFY_API_KEY is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body?.orderId as string | undefined;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load order with product info (adapt field names to your schema)
    const { data: order, error: orderErr } = await (supabase as any)
      .from("orders")
      .select("id, user_id, product_id, quantity, total_price, status, checkout_session_id, store_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", details: orderErr }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: product, error: productErr } = await (supabase as any)
      .from("products")
      .select("id, name, price_in_cents, print_provider_id, print_blueprint_id, print_variant_id, external_sku")
      .eq("id", order.product_id)
      .single();

    if (productErr || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found", details: productErr }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a minimal Printify order payload. Real payloads need address + items mapping to blueprint/variant.
    const printifyPayload: Record<string, unknown> = {
      external_id: order.id,
      label: product.name,
      line_items: [
        {
          // Prefer a known variant mapping if available, else fallback to an external SKU for manual review
          product_id: product.print_blueprint_id ?? undefined,
          variant_id: product.print_variant_id ?? undefined,
          sku: product.external_sku ?? undefined,
          quantity: order.quantity || 1,
        },
      ],
      // Without a shipping address we submit as a draft for later completion.
      // If you have shipping info, include `shipping_method`, `address_to`, etc.
      // https://developers.printify.com/#create-an-order
      send_shipping_notification: false,
    };

    let printifyResponse: any = null;
    let printifyStatus = 0;
    try {
      const resp = await fetch("https://api.printify.com/v1/orders.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(printifyPayload),
      });
      printifyStatus = resp.status;
      const text = await resp.text();
      try {
        printifyResponse = JSON.parse(text);
      } catch {
        printifyResponse = { raw: text };
      }
    } catch (e) {
      // Network/transport error
      printifyResponse = { error: String(e) };
    }

    // Update order status based on Printify response
    if (printifyStatus >= 200 && printifyStatus < 300) {
      await (supabase as any)
        .from("orders")
        .update({ fulfillment_status: "submitted", fulfillment_provider: "printify", fulfillment_ref: printifyResponse?.id ?? null })
        .eq("id", orderId);
    } else {
      await (supabase as any)
        .from("orders")
        .update({ fulfillment_status: "submission_failed", fulfillment_error: printifyResponse?.error ?? JSON.stringify(printifyResponse).slice(0, 500) })
        .eq("id", orderId);
    }

    return new Response(
      JSON.stringify({ ok: printifyStatus >= 200 && printifyStatus < 300, status: printifyStatus, response: printifyResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return formatError(error as Error);
  }
});
