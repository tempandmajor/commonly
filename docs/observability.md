# Observability Plan

Edge Functions (Deno)
- Use Sentry Deno SDK in `supabase/functions/stripe-config.ts` (already present) and ensure DSN set via env
- Propagate `traceparent` from BFF to Edge Functions (BFF already includes a header); Edge Functions can capture it as needed
- Optional: push traces via OTLP from Edge Functions using a lightweight exporter; or rely on Sentry for error traces only

BFF (Node)
- OTel tracing initialized with OTLP HTTP exporter when `OTEL_EXPORTER_OTLP_ENDPOINT` is set
- Add route-level span attributes for payments/checkout, set `user_id` when available

Dashboards & Alerts
- Tracing backend: point OTLP to your collector (e.g., Grafana Tempo, Honeycomb, or OTEL collector + Jaeger)
- Basic alerts:
  - Stripe webhook error rate > 1% over 5m
  - Outbox dead letter count increase
  - BFF 5xx rate or p95 latency
- Logs: ship BFF logs to your logging backend; add JSON logger if needed 