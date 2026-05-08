-- dynamic_products: universal table mapping a local product row to a Stripe Product.
-- Name, description, price, and currency live in Stripe (source of truth — editable
-- in Stripe Dashboard, picked up at next read). Product-specific fields live in
-- the JSONB `metadata` column so new product types don't need schema changes.
--
-- Examples of metadata payloads:
--   consulting_hours     -> { "hours_per_pack": 8 }
--   ai_booster           -> { "credits": 500 }
--   genesis_ai_booster   -> { "credits": 500 }
--   extra_device         -> { "recurring": "monthly" }
--   extra_module         -> { "recurring": "monthly" }
--
-- product_key is the stable identifier the app uses to fetch a row
-- (e.g. "consulting_hours"). stripe_product_id is the Stripe-side identifier.

create table if not exists public.dynamic_products (
  id                uuid        primary key default gen_random_uuid(),
  product_key       text        not null unique,
  stripe_product_id text        not null unique,
  metadata          jsonb       not null default '{}'::jsonb,
  is_active         boolean     not null default true,
  sort_order        integer     not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists dynamic_products_active_idx
  on public.dynamic_products(is_active, sort_order)
  where is_active = true;

create index if not exists dynamic_products_key_idx
  on public.dynamic_products(product_key)
  where is_active = true;

create or replace function public.dynamic_products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dynamic_products_updated_at on public.dynamic_products;
create trigger dynamic_products_updated_at
  before update on public.dynamic_products
  for each row execute function public.dynamic_products_set_updated_at();

alter table public.dynamic_products enable row level security;

drop policy if exists dynamic_products_select_active on public.dynamic_products;
create policy dynamic_products_select_active
  on public.dynamic_products
  for select
  to authenticated
  using (is_active = true);

drop policy if exists dynamic_products_super_admin_all on public.dynamic_products;
create policy dynamic_products_super_admin_all
  on public.dynamic_products
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'superadmin@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'superadmin@gmail.com');

-- Seed: replace stripe_product_id with the real Product ID for the existing
-- consulting Price (price_1TTkHV9qEJAUBztIMnqZAQNz). Look it up in Stripe Dashboard
-- under Products, or via API: stripe.prices.retrieve('price_…').product
-- Other add-ons (ai_booster, extra_device, extra_module, genesis_ai_booster)
-- can be inserted here once their Stripe Products are configured.
insert into public.dynamic_products (product_key, stripe_product_id, metadata, sort_order)
values ('consulting_hours', 'REPLACE_WITH_STRIPE_PRODUCT_ID', '{"hours_per_pack": 8}'::jsonb, 0)
on conflict (product_key) do nothing;
