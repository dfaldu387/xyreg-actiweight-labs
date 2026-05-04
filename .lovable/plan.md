# Generalised role-driven training derivation

The previous plan special-cased Marcus. Correcting course: the fix is structural — derive recommended training from each user's defined role on `user_company_access`, and where the role is undefined, force the user to define it before training can be recommended. No per-person backfills.

## Current data reality
`user_company_access` already carries: `is_internal`, `department` (free text), `functional_area` (enum), `external_role` (enum). For Actiweight today:
- 2 consultants → `external_role='consultant'`, no department.
- Marcus → `is_internal=true`, `department='Internal'`, `functional_area=NULL`. "Internal" is a bucket, not a role; no job title is captured anywhere.

So the gap is universal: there is no field for the **job title / position** (CEO, Quality Manager, R&D Engineer…), and `functional_area` is optional.

## A. Schema (one migration)
Add `job_title text` to `user_company_access` (nullable). No data backfill — users (or admins) fill it in via Settings.

## B. Settings — People editor
In `AddStakeholderUserSheet` and the corresponding edit sheet, add a "Job title" input directly under the Functional Area select, for internal users. External users keep `external_role`.

## C. Label composition (`trainingGroups.ts`)
`getInferredRoleLabel` returns:
- internal + `job_title` + `functional_area` → `"<FunctionalArea> | <Job title>"` (e.g. `Management | CEO`).
- internal + only `job_title` → `<Job title>` + amber "Set functional area".
- internal + only `functional_area` → `<FunctionalArea>` + amber "Add job title".
- internal + neither (only `department='Internal'`) → amber "Define role" badge with a CTA link to Settings → People for that user.
- external → existing `external_role` label unchanged.

`getRecommendedGroupsForUser` keeps using `functional_area` + `external_role` + keyword scan over `department` / `job_title`. Adding `job_title` to the keyword scan is the only behavioural change (so "CEO", "Quality Manager", etc. resolve even when functional_area is empty).

## D. Wizard — `PeopleRecommendationTable`
- Render the new combined label.
- When a row's role is undefined, disable "Apply" and show inline link "Define role in Settings → People" (deep link to that user's edit sheet).
- Keep "Apply all" but it skips undefined-role rows and reports "<n> skipped — role undefined".

## E. Copy fix
Replace the `§` glyph with the word "Section" in the wizard empty-state alert (the "Russian letters" report — it is the section sign, not Cyrillic; English wording avoids the confusion).

## Files
- `supabase/migrations/*` — add `job_title` column.
- `src/hooks/useCompanyUsers.ts` — select/update `job_title`, expose as `title`.
- `src/components/settings/AddStakeholderUserSheet.tsx` (+ edit sheet) — Job title input.
- `src/constants/trainingGroups.ts` — label + recommendation logic.
- `src/components/training/TrainingSetupWizard.tsx` — disabled state, deep link, skip-count, copy fix.

## Out of scope
No backfill for Marcus or anyone else, no `company_roles` rewiring, no auth/RLS changes, no new tables.
