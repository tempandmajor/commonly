-- Phase 1: Policy tests scaffold (run in CI manually or via psql)
-- This is a minimal placeholder; replace with pgTAP if available

\set ON_ERROR_STOP on

begin;

-- Assert that critical tables have RLS enabled
-- If any select fails, script will stop with error
select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'ledger_entries' and c.relrowsecurity = true;
select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'ledger_transactions' and c.relrowsecurity = true;
select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'idempotency_keys' and c.relrowsecurity = true;
select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'outbox_events' and c.relrowsecurity = true;
select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'stripe_events' and c.relrowsecurity = true;

-- Assert deny-all policies exist on internal tables
DO $$
DECLARE cnt int;
BEGIN
  select count(*) into cnt from pg_policies where schemaname='public' and tablename='idempotency_keys' and policyname='deny all idempotency';
  IF cnt = 0 THEN RAISE EXCEPTION 'Missing deny-all policy on idempotency_keys'; END IF;
  select count(*) into cnt from pg_policies where schemaname='public' and tablename='outbox_events' and policyname='deny all outbox';
  IF cnt = 0 THEN RAISE EXCEPTION 'Missing deny-all policy on outbox_events'; END IF;
  select count(*) into cnt from pg_policies where schemaname='public' and tablename='stripe_events' and policyname='deny all stripe_events';
  IF cnt = 0 THEN RAISE EXCEPTION 'Missing deny-all policy on stripe_events'; END IF;
END$$;

-- Assert anon has no direct table privileges on public schema
DO $$
DECLARE cnt int;
BEGIN
  select count(*) into cnt
  from information_schema.table_privileges
  where grantee = 'anon' and table_schema = 'public';
  IF cnt > 0 THEN RAISE EXCEPTION 'anon should not have direct table privileges on public schema'; END IF;
END$$;

commit; 