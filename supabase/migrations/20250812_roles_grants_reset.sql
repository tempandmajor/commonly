-- Phase 1: Roles/Grants reset and baseline policies
-- Note: safe defaults; adjust as needed in follow-ups

begin;

-- Ensure required extensions
create extension if not exists pgcrypto;

-- Lock down public schema by default
revoke all on schema public from anon, authenticated;
grant usage on schema public to authenticated;

-- Revoke broad table access; grant minimal selects if required later
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- Critical financial tables: strict RLS
alter table if exists public.ledger_entries enable row level security;
alter table if exists public.ledger_transactions enable row level security;
alter table if exists public.payment_history enable row level security;
alter table if exists public.outbox_events enable row level security;
alter table if exists public.outbox_dead_letter enable row level security;
alter table if exists public.idempotency_keys enable row level security;
alter table if exists public.stripe_events enable row level security;

-- Policies: deny by default
-- Example: idempotency_keys - no direct end-user access
drop policy if exists "deny all idempotency" on public.idempotency_keys;
create policy "deny all idempotency" on public.idempotency_keys for all using (false) with check (false);

-- Outbox readable only to service
drop policy if exists "deny all outbox" on public.outbox_events;
create policy "deny all outbox" on public.outbox_events for all using (false) with check (false);

-- Stripe events readable only to service
drop policy if exists "deny all stripe_events" on public.stripe_events;
create policy "deny all stripe_events" on public.stripe_events for all using (false) with check (false);

-- Device tokens example: owner-only (if table exists)
-- create policy "own tokens" on public.device_tokens for select using (auth.uid() = user_id);
-- create policy "insert own tokens" on public.device_tokens for insert with check (auth.uid() = user_id);

commit; 