# Outbox Drain Scheduler

This repo provides a function `public.invoke_outbox_drain()` to trigger the `outbox-drain` Edge Function via HTTP using `pg_net`.

Prerequisites
- `pg_net` extension enabled (migration `20250812_outbox_scheduler.sql` covers this).
- `app.supabase_project_ref` and `app.supabase_cron_key` GUCs set in the database.

Setting GUCs
Run as a superuser (via Supabase SQL editor):
```sql
-- Replace values with your project details
select set_config('app.supabase_project_ref', '<PROJECT_REF>', true);
select set_config('app.supabase_cron_key', '<CRON_SERVICE_ROLE_KEY>', true);
```

Manual trigger
```sql
select public.invoke_outbox_drain();
```

Scheduling via Supabase Dashboard
- Go to Functions → Schedules → Create Schedule
- Select HTTP request and set URL to your function endpoint:
  - `https://<PROJECT_REF>.supabase.co/functions/v1/outbox-drain`
- Add header `Authorization: Bearer <CRON_SERVICE_ROLE_KEY>`
- Choose your interval, e.g., every 1 minute.

Verification
- Check table `outbox_events` for `processed_at` increments after scheduled runs
- The `outbox_dead_letter` table should remain empty for healthy processing
- BFF metrics endpoint `/api/metrics/ledger-invariants` should show `ok: true` over time 