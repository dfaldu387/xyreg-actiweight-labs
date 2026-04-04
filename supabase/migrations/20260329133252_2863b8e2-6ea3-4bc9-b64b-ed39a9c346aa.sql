
create table public.company_release_adoptions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  release_id uuid not null references public.xyreg_releases(id) on delete cascade,
  adopted_at timestamptz not null default now(),
  adopted_by uuid references auth.users(id),
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, release_id)
);

create index idx_company_release_adoptions_active on public.company_release_adoptions(company_id, status) where status = 'active';

alter table public.company_release_adoptions enable row level security;

create policy "Users can view own company adoptions"
  on public.company_release_adoptions for select
  to authenticated
  using (true);

create policy "Users can create adoptions"
  on public.company_release_adoptions for insert
  to authenticated
  with check (true);

create policy "Users can update adoptions"
  on public.company_release_adoptions for update
  to authenticated
  using (true)
  with check (true);

create or replace function public.deactivate_previous_adoption()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.company_release_adoptions
  set status = 'completed', updated_at = now()
  where company_id = NEW.company_id
    and status = 'active'
    and id != NEW.id;
  return NEW;
end;
$$;

create trigger trg_deactivate_previous_adoption
  after insert on public.company_release_adoptions
  for each row
  execute function public.deactivate_previous_adoption();
