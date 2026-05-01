---
name: Eager per-company WI seeding
description: All global WIs are materialized into per-company drafts at company onboarding (and on demand via SopAutoSeedStatus); they appear in the document list immediately as WI-XX-NNN.
type: feature
---
Companion to lazy `materializeGlobalWIForCompany`. The eager path lives in
`src/services/eagerSeedCompanyWIsClient.ts` and walks the full
`global_work_instructions` catalog, calling the same per-WI materializer
for any entry not already present in `global_wi_company_materializations`
for the company.

Triggers:
- `useRegistrationFlow` runs `eagerSeedCompanyWorkInstructions` right
  after `seedTierASopsForCompany` on company creation. Failure is logged
  but non-fatal.
- `SopAutoSeedStatus` exposes a "Create N WIs for this company" button
  with progress, used to backfill companies that existed before this
  feature shipped (e.g. Actiweight Labs).

Numbering carries the parent SOP family number so WI ↔ SOP matching is
visual:
  parent `SOP-QA-001` → `WI-QA-001-1`, `WI-QA-001-2`, …
The materializer reuses the global WI number as-is (no per-company
re-numbering); collisions are impossible because the child index is
scoped to the parent SOP family.

Idempotent: the materialization table dedupes, so re-clicking the button
is safe.
