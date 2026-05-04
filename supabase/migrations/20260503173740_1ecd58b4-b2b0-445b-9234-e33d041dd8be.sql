-- User-authored document comments (separate from imported docx_comments)
create table if not exists public.document_user_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  company_id uuid not null,
  author_id uuid not null,
  author_name text,
  content text not null,
  quoted_text text,
  anchor jsonb,
  parent_id uuid references public.document_user_comments(id) on delete cascade,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_duc_document on public.document_user_comments(document_id);
create index if not exists idx_duc_company on public.document_user_comments(company_id);
create index if not exists idx_duc_parent on public.document_user_comments(parent_id);

alter table public.document_user_comments enable row level security;

drop policy if exists "duc_select_company_members" on public.document_user_comments;
create policy "duc_select_company_members"
on public.document_user_comments for select
to authenticated
using (
  exists (
    select 1 from public.user_company_access uca
    where uca.user_id = auth.uid()
      and uca.company_id = document_user_comments.company_id
  )
);

drop policy if exists "duc_insert_company_members" on public.document_user_comments;
create policy "duc_insert_company_members"
on public.document_user_comments for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.user_company_access uca
    where uca.user_id = auth.uid()
      and uca.company_id = document_user_comments.company_id
  )
);

drop policy if exists "duc_update_company_members" on public.document_user_comments;
create policy "duc_update_company_members"
on public.document_user_comments for update
to authenticated
using (
  exists (
    select 1 from public.user_company_access uca
    where uca.user_id = auth.uid()
      and uca.company_id = document_user_comments.company_id
  )
);

drop policy if exists "duc_delete_own" on public.document_user_comments;
create policy "duc_delete_own"
on public.document_user_comments for delete
to authenticated
using (author_id = auth.uid());

create or replace function public.touch_document_user_comments()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_touch_duc on public.document_user_comments;
create trigger trg_touch_duc
before update on public.document_user_comments
for each row execute function public.touch_document_user_comments();