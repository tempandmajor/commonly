# Outbox Scheduler

Enable a periodic HTTP invocation of the `outbox-drain` edge function.

1) Set secret in Supabase project
- SUPABASE_CRON_KEY: a long random string

2) Configure HTTP Scheduler in Supabase
- URL: `https://<project-ref>.supabase.co/functions/v1/outbox-drain`
- Method: POST
- Headers:
  - `Content-Type: application/json`
  - `Authorization: SUPABASE_CRON_KEY`
- Body: `{}`
- Schedule: every 5 minutes

3) Verify
- Check `outbox_events` rows are marked with `processed_at`
- Check `outbox_dead_letter` remains empty during normal operation
- The function uses exponential backoff via `attempts` and `next_attempt_at` columns.
- Endpoint is protected by `SUPABASE_CRON_KEY` header. 