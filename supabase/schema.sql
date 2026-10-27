-- Catalygn Edge Business Health Check schema for Supabase Postgres.
-- Run in Supabase SQL Editor, then enable Realtime on the bhc-session broadcast.

create table if not exists public.bhc_sessions (
  id text primary key,
  question_index integer not null default 0 check (question_index between 0 and 14),
  status text not null default 'live' check (status in ('live', 'paused', 'ended')),
  unlock_version integer not null default 0 check (unlock_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bhc_assessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  participant_id uuid,
  session_id text not null,
  participant_name text not null check (char_length(participant_name) between 2 and 80),
  company_name text not null check (char_length(company_name) between 2 and 120),
  answers jsonb not null,
  sales_score integer not null check (sales_score between 0 and 100),
  operations_score integer not null check (operations_score between 0 and 100),
  finance_score integer not null check (finance_score between 0 and 100),
  total_points integer not null check (total_points between 0 and 45),
  overall_score integer not null check (overall_score between 0 and 100),
  classification text not null,
  weakest_pillar text,
  scoring_version text not null,
  assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bhc_assessments_session_idx on public.bhc_assessments (session_id, created_at desc);

create or replace function public.bhc_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bhc_sessions_touch on public.bhc_sessions;
create trigger bhc_sessions_touch
before update on public.bhc_sessions
for each row execute function public.bhc_touch_updated_at();

-- Row Level Security: deny all client access. Only the service role key
-- (used exclusively by server routes) bypasses RLS.
alter table public.bhc_sessions enable row level security;
alter table public.bhc_assessments enable row level security;

-- No policies are created on purpose: anon and authenticated roles get zero rows,
-- so one participant can never read another participant's data.
revoke all on public.bhc_sessions from anon, authenticated;
revoke all on public.bhc_assessments from anon, authenticated;

-- Seed the workshop session used by NEXT_PUBLIC default SESSION_ID.
insert into public.bhc_sessions (id, question_index, status, unlock_version)
values ('catalygn-edge-workshop-1', 0, 'live', 0)
on conflict (id) do nothing;
