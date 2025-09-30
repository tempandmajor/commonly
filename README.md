# Commonly App

## New backend capabilities

- Edge functions:
  - `payment-methods`: idempotent SetupIntent creation and listing
  - `payment-handler`: payment method CRUD with Stripe
  - `stripe-webhook`: verifies and persists Stripe events; emits domain events
  - `outbox-drain`: processes `outbox_events` with retries and DLQ
  - `email-sender`: minimal email dispatch via `EMAIL_WEBHOOK_URL`

- Database foundations:
  - `outbox_events` with retry/backoff and `outbox_dead_letter`
  - `stripe_events` persistence
  - `idempotency_keys` caching responses

- Scheduling:
  - Schedule HTTP POST to `/functions/v1/outbox-drain` every 5 minutes with header `Authorization: SUPABASE_CRON_KEY`

## Observability
- Sentry is supported on edge functions when `SENTRY_DSN` is set.

## Security headers
- See `vercel.json` for CSP, HSTS, and other headers. Functions add `Cache-Control: no-store`.

## CI/CD
- GitHub Actions workflow `.github/workflows/ci.yml` runs type-check, lint, build, and schema audit.
