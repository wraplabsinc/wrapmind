-- ai_conversations: session/thread container for AI chat history
create table if not exists ai_conversations (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references organizations(id) on delete cascade,
  profile_id   uuid not null references profiles(id) on delete cascade,
  title        text not null default 'New conversation',
  created_at   timestamp with time zone not null default now(),
  updated_at   timestamp with time zone not null default now()
);

-- Index for per-org listing ordered by recency
create index if not exists idx_ai_conversations_org_updated
  on ai_conversations(org_id, updated_at desc);

-- Auto-update updated_at on row change
create or replace function ai_conversations_updated_at()
returns trigger language plpgsql security definer as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

drop trigger if exists ai_conversations_updated_at_trigger on ai_conversations;
create trigger ai_conversations_updated_at_trigger
  before update on ai_conversations
  for each row execute function ai_conversations_updated_at();

-- RLS: org members can read/create conversations for their org
alter table ai_conversations enable row level security;

drop policy if exists "org_member_manage_conversations" on ai_conversations;
create policy "org_member_manage_conversations" on ai_conversations
  for all using (
    org_id in (
      select org_id from profiles where user_id = auth.uid()
    )
  ) with check (
    org_id in (
      select org_id from profiles where user_id = auth.uid()
    )
  );
