-- Creator waitlist and invites, plus platform settings flag to toggle waitlist
begin;

-- platform settings: key/value with typed column for waitlist toggle
create table if not exists public.platform_settings (
  key text primary key,
  bool_value boolean,
  json_value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_platform_setting_bool(p_key text, p_value boolean)
returns void language plpgsql as $$
begin
  insert into public.platform_settings(key, bool_value)
  values (p_key, p_value)
  on conflict (key) do update set bool_value = excluded.bool_value, updated_at = now();
end;$$;

-- default: waitlist enabled
insert into public.platform_settings(key, bool_value)
values ('waitlist_enabled', true)
on conflict (key) do nothing;

-- users flag to grant creator capability
alter table if exists public.users
  add column if not exists can_create_events boolean not null default false;

-- creator_waitlist: requests to become creator
create table if not exists public.creator_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes text,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_waitlist_email_idx on public.creator_waitlist (lower(email));
create index if not exists creator_waitlist_status_idx on public.creator_waitlist (status);

-- creator_invites: invite tokens
create table if not exists public.creator_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  accepted_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz
);
create index if not exists creator_invites_email_idx on public.creator_invites (lower(invitee_email));
create index if not exists creator_invites_status_idx on public.creator_invites (status);

-- Helper: can user create events? True if waitlist disabled or user flag true
create or replace function public.can_user_create_events(p_user_id uuid)
returns boolean language sql stable as $$
  select coalesce((select not coalesce((select bool_value from public.platform_settings where key='waitlist_enabled'), true)), false)
         or coalesce((select can_create_events from public.users where id = p_user_id), false)
$$;

-- RLS
alter table public.platform_settings enable row level security;
alter table public.creator_waitlist enable row level security;
alter table public.creator_invites enable row level security;

-- policies: platform_settings admin-only
-- Deny all by default
drop policy if exists "deny all settings" on public.platform_settings;
create policy "deny all settings" on public.platform_settings for all using (false) with check (false);
-- Allow admins to read/write
drop policy if exists "admin manage settings" on public.platform_settings;
create policy "admin manage settings" on public.platform_settings for all
using (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true))
with check (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true));

-- policies: creator_waitlist
-- Deny all baseline
drop policy if exists "deny all waitlist" on public.creator_waitlist;
create policy "deny all waitlist" on public.creator_waitlist for all using (false) with check (false);
-- Owner can read their own rows
drop policy if exists "waitlist owner read" on public.creator_waitlist;
create policy "waitlist owner read" on public.creator_waitlist for select
using ((auth.uid() is not null) and (user_id = auth.uid()));
-- Authenticated can insert their own request
drop policy if exists "waitlist self insert" on public.creator_waitlist;
create policy "waitlist self insert" on public.creator_waitlist for insert
with check ((auth.uid() is not null) and (user_id = auth.uid()));
-- Admin can read/update all
drop policy if exists "waitlist admin all" on public.creator_waitlist;
create policy "waitlist admin all" on public.creator_waitlist for all
using (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true))
with check (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true));

-- policies: creator_invites
-- Deny all baseline
drop policy if exists "deny all invites" on public.creator_invites;
create policy "deny all invites" on public.creator_invites for all using (false) with check (false);
-- Admin can manage all invites
drop policy if exists "invites admin all" on public.creator_invites;
create policy "invites admin all" on public.creator_invites for all
using (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true))
with check (exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_admin,false) = true));
-- Creators can create invites
drop policy if exists "invites creators insert" on public.creator_invites;
create policy "invites creators insert" on public.creator_invites for insert
with check (
  auth.uid() is not null
  and inviter_user_id = auth.uid()
  and exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.can_create_events,false)=true)
);
-- Creators can view their invites
drop policy if exists "invites creators read own" on public.creator_invites;
create policy "invites creators read own" on public.creator_invites for select
using (inviter_user_id = auth.uid());

commit; 