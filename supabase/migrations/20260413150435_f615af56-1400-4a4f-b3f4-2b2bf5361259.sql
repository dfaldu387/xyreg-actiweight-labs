create table public.user_company_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index idx_user_company_time_entries_lookup 
  on public.user_company_time_entries (user_id, company_id, started_at);

alter table public.user_company_time_entries enable row level security;

create policy "Users can view own time entries"
  on public.user_company_time_entries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own time entries"
  on public.user_company_time_entries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own time entries"
  on public.user_company_time_entries for update
  to authenticated
  using (auth.uid() = user_id);