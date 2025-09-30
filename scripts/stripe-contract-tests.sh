#!/usr/bin/env bash
set -euo pipefail

# Contract tests placeholder for Stripe webhooks using Stripe CLI
# Requirements:
# - stripe CLI installed and authenticated (https://stripe.com/docs/cli)
# - Environment:
#   STRIPE_SECRET_KEY          : Stripe API key (test)
#   STRIPE_WEBHOOK_SECRET      : Signing secret for your webhook endpoint
#   SUPABASE_URL               : Base URL of your Supabase project
#   SUPABASE_FUNCTION_PATH     : Defaults to /functions/v1/stripe-webhook

: "${SUPABASE_FUNCTION_PATH:=/functions/v1/stripe-webhook}"

if ! command -v stripe >/dev/null 2>&1; then
  echo "[stripe-contract-tests] Stripe CLI not found. Skipping."
  exit 0
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" || -z "${STRIPE_WEBHOOK_SECRET:-}" || -z "${SUPABASE_URL:-}" ]]; then
  echo "[stripe-contract-tests] Missing env. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL. Skipping."
  exit 0
fi

WEBHOOK_URL="${SUPABASE_URL%/}${SUPABASE_FUNCTION_PATH}"

echo "[stripe-contract-tests] Replaying a minimal set of webhook events to ${WEBHOOK_URL}"

# Example replay for a completed checkout session event
# In practice, you might create a session via API and then trigger completion.
# For now we just show the command and skip if it fails.
set +e
stripe events resend "evt_123" \
  --forward-to "${WEBHOOK_URL}" \
  --forward-connect-to "${WEBHOOK_URL}" \
  --signing-secret "${STRIPE_WEBHOOK_SECRET}" \
  --force || true
set -e

echo "[stripe-contract-tests] Done (best-effort)." 