-- Enable UUID extension if not present
create extension if not exists "uuid-ossp";

-- ai_usage_ledger: record every AI call for cost/audit
create table if not exists ai_usage_ledger (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_cents integer not null,
  created_at timestamp with time zone default now()
);

-- Indexes for org-level spend queries
create index if not exists idx_ai_usage_org on ai_usage_ledger(org_id, created_at);
create index if not exists idx_ai_usage_user on ai_usage_ledger(user_id, created_at);

-- RLS: org members can read their own usage; service role can insert; admins can read
alter table ai_usage_ledger enable row level security;
drop policy if exists "org_member_read_own_usage" on ai_usage_ledger;
create policy "org_member_read_own_usage" on ai_usage_ledger
  for select using (
    org_id = (
      select (auth.jwt() ->> 'app_metadata'::text ->> 'org_id')::uuid
    )
  );
drop policy if exists "service_role_insert" on ai_usage_ledger;
create policy "service_role_insert" on ai_usage_ledger
  for insert with check (true);

-- ai_circuit_breaker: global failure counter (feature_key='global')
create table if not exists ai_circuit_breaker (
  feature_key text primary key,
  failure_count integer not null default 0,
  last_failure_at timestamp with time zone
);

-- Seed global row
insert into ai_circuit_breaker (feature_key, failure_count, last_failure_at)
values ('global', 0, null)
on conflict (feature_key) do nothing;

-- RLS: service role can manage all
alter table ai_circuit_breaker enable row level security;
drop policy if exists "service_role_manage" on ai_circuit_breaker;
create policy "service_role_manage" on ai_circuit_breaker for all using (true);

-- Functions
drop function if exists ai_circuit_breaker_reset();
create or replace function ai_circuit_breaker_reset()
returns void language plpgsql security definer as $$
begin
  update ai_circuit_breaker
  set failure_count = 0, last_failure_at = null
  where feature_key = 'global';
end;
$$;

drop function if exists ai_circuit_breaker_record_failure();
create or replace function ai_circuit_breaker_record_failure()
returns void language plpgsql security definer as $$
begin
  update ai_circuit_breaker
  set failure_count = failure_count + 1,
      last_failure_at = now()
  where feature_key = 'global';
end;
$$;

drop function if exists ai_circuit_breaker_is_open();
create or replace function ai_circuit_breaker_is_open()
returns boolean language plpgsql security definer as $$
declare
  rec record;
begin
  select * into rec from ai_circuit_breaker where feature_key = 'global';
  if rec.failure_count >= 3 and rec.last_failure_at > now() - interval '5 minutes' then
    return true;
  end if;
  return false;
end;
$$;
