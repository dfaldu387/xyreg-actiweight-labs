
create table public.bom_item_product_scope (
  id uuid primary key default gen_random_uuid(),
  bom_item_id uuid references public.bom_items(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz default now(),
  unique(bom_item_id, product_id)
);

alter table public.bom_item_product_scope enable row level security;

create policy "Users can view scope for their company"
on public.bom_item_product_scope for select to authenticated
using (
  exists (
    select 1 from public.user_company_access uca
    where uca.user_id = auth.uid() and uca.company_id = bom_item_product_scope.company_id
  )
);

create policy "Users can manage scope for their company"
on public.bom_item_product_scope for all to authenticated
using (
  exists (
    select 1 from public.user_company_access uca
    where uca.user_id = auth.uid() and uca.company_id = bom_item_product_scope.company_id
  )
)
with check (
  exists (
    select 1 from public.user_company_access uca
    where uca.user_id = auth.uid() and uca.company_id = bom_item_product_scope.company_id
  )
);

create index idx_bom_item_product_scope_item on public.bom_item_product_scope(bom_item_id);
create index idx_bom_item_product_scope_product on public.bom_item_product_scope(product_id);
create index idx_bom_item_product_scope_company on public.bom_item_product_scope(company_id);
