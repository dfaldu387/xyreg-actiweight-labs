-- tenant_configs: per-deployment configuration for the multi-tenant build.
-- Each row maps a VITE_TENANT_KEY value to its allowed companies and metadata.
-- Feature flags (genesis, investor, audit, google, edge-fn reset email) stay
-- in code (src/config/tenants.ts) — only access lists and identifiers live here.

create table if not exists public.tenant_configs (
  id                 uuid        primary key default gen_random_uuid(),
  key                text        unique not null,                       -- matches VITE_TENANT_KEY
  name               text        not null,                              -- 'David Health Solutions'
  branch_name        text,                                              -- git branch this tenant is deployed from, e.g. 'client/davidhealth'
  url                text,                                              -- 'https://app.davidhealth.xyreg.com'
  company_id         uuid        references public.companies(id) on delete set null,
  stripe_id          text,                                              -- Stripe customer/account id
  allow_company_ids  uuid[]      not null default '{}'::uuid[],         -- empty array = allow all
  inserted_at        timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists tenant_configs_key_idx on public.tenant_configs(key);

create or replace function public.tenant_configs_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenant_configs_updated_at on public.tenant_configs;
create trigger tenant_configs_updated_at
  before update on public.tenant_configs
  for each row execute function public.tenant_configs_set_updated_at();

-- SECURITY DEFINER read path: callable during sign-in by any authenticated user
-- BEFORE super-admin status is known. Returns only the allow list, nothing else.
create or replace function public.get_tenant_allow_company_ids(tenant_key text)
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(allow_company_ids, '{}'::uuid[])
  from public.tenant_configs
  where key = tenant_key
  limit 1
$$;

grant execute on function public.get_tenant_allow_company_ids(text) to authenticated, anon;

alter table public.tenant_configs enable row level security;

-- Super admin manages the table directly (used by the dashboard CRUD).
-- TODO: if your super-admin check moves to a roles table or a JWT claim,
-- replace the email predicate below.
drop policy if exists tenant_configs_super_admin_all on public.tenant_configs;
create policy tenant_configs_super_admin_all
  on public.tenant_configs
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'superadmin@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'superadmin@gmail.com');

-- Seed rows for existing tenants. Populate allow_company_ids via the super
-- admin dashboard (or SQL) once real company UUIDs are known.
insert into public.tenant_configs (key, name, branch_name, url, allow_company_ids) values
  ('arnar',       'Xyreg (Arnar)',          'client/arnar',       null, '{}'::uuid[]),
  ('mockup',      'Xyreg Mockup',           'main',               null, '{}'::uuid[]),
  ('genish',      'Genis',                  'client/genish',      null, '{}'::uuid[]),
  ('actiweight',  'Actiweight Labs',        'client/actiweight',  null, '{}'::uuid[]),
  ('davidhealth', 'David Health Solutions', 'client/davidhealth', null, '{}'::uuid[])
on conflict (key) do nothing;
