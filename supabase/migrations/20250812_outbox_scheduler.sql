-- Phase 4: Scheduler for outbox-drain
create extension if not exists pg_net;

-- Function to invoke outbox-drain is defined in earlier migration; ensure grant exists
create or replace function public.invoke_outbox_drain()
returns void
language plpgsql
as $$
declare
  project_ref text := current_setting('app.supabase_project_ref', true);
  cron_key text := current_setting('app.supabase_cron_key', true);
  function_url text;
  headers jsonb;
begin
  if project_ref is null or cron_key is null then
    raise notice 'Missing settings for project_ref/cron_key';
    return;
  end if;
  function_url := format('https://%s.supabase.co/functions/v1/outbox-drain', project_ref);
  headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || cron_key);
  perform net.http_post(url := function_url, headers := headers, body := '{}'::jsonb);
end;
$$;

grant execute on function public.invoke_outbox_drain() to authenticated; 