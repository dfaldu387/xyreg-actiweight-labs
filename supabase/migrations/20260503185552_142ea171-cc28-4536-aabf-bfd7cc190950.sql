-- Training: link modules to source SOP documents + quiz scaffolding

alter table public.training_modules
  add column if not exists source_document_id uuid references public.documents(id) on delete set null,
  add column if not exists source_version text,
  add column if not exists auto_generated boolean not null default false,
  add column if not exists pass_threshold integer not null default 80;

create unique index if not exists training_modules_source_doc_unique
  on public.training_modules(company_id, source_document_id)
  where source_document_id is not null;

alter table public.training_records
  add column if not exists quiz_score numeric,
  add column if not exists quiz_passed_at timestamptz,
  add column if not exists quiz_attempts_count integer not null default 0;

create table if not exists public.training_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_quiz_questions_module_idx
  on public.training_quiz_questions(module_id, order_index);

alter table public.training_quiz_questions enable row level security;

create policy "quiz questions readable by company members"
  on public.training_quiz_questions for select
  using (
    exists (
      select 1 from public.training_modules tm
      where tm.id = training_quiz_questions.module_id
        and tm.company_id in (
          select company_id from public.user_company_access
          where user_id = auth.uid()
        )
    )
  );

create policy "quiz questions writable by company members"
  on public.training_quiz_questions for all
  using (
    exists (
      select 1 from public.training_modules tm
      where tm.id = training_quiz_questions.module_id
        and tm.company_id in (
          select company_id from public.user_company_access
          where user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.training_modules tm
      where tm.id = training_quiz_questions.module_id
        and tm.company_id in (
          select company_id from public.user_company_access
          where user_id = auth.uid()
        )
    )
  );

create table if not exists public.training_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.training_records(id) on delete cascade,
  user_id uuid not null,
  answers jsonb not null,
  score numeric not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);
create index if not exists training_quiz_attempts_record_idx
  on public.training_quiz_attempts(record_id, attempted_at desc);

alter table public.training_quiz_attempts enable row level security;

create policy "users see own quiz attempts"
  on public.training_quiz_attempts for select
  using (user_id = auth.uid());

create policy "users insert own quiz attempts"
  on public.training_quiz_attempts for insert
  with check (user_id = auth.uid());