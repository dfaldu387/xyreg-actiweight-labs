---
name: Global WI Catalog v2
description: Curated per-SOP WI counts with stable wiSlug numbering, no AI-proposed focuses
type: feature
---

The global Work Instruction catalog (`global_work_instructions` table) is
rebuilt from a curated spec at `src/constants/globalWiCatalogSpec.ts`. Each
Tier-A SOP has an explicit list of WIs (variable count, 0–7); the AI only
writes the content for each named WI, never proposes the list itself.

Key rules:
- WI numbers carry the parent SOP family number, format
  `WI-{subPrefix}-{parentSopNum}-{childIdx}` (e.g. parent `SOP-QA-001` →
  `WI-QA-001-1`, `WI-QA-001-2`). Per-company materialization reuses the
  global number as-is.
- Curated focuses live in `GLOBAL_WI_CATALOG_SPEC[sopKey]` as ordered arrays
  of `{ slug, focus, roles }`. Order = WI number suffix (1-based). Do not
  reorder once shipped — slugs are stable, positions are not.
- SOPs absent from the spec map (e.g. Quality Manual) get **zero** WIs
  intentionally. They are manuals, not procedures.
- Edge function `seed-global-work-instructions` accepts the curated focuses
  via `body.sops[].focuses`. When provided, AI focus-proposal is bypassed.
- Title sanitizer in the edge function strips any leaked `WI-XX-NNN:` prefix
  the AI might embed in the title. Belt-and-suspenders.
- Module keys are normalized lowercase to match `ALL_MODULE_KEYS`.
- "Regenerate v2" button in `SopAutoSeedStatus` triggers a `replace: true`
  rebuild, with SOP-by-SOP progress (one edge invocation per SOP to stay
  under the 150s idle timeout).

The catalog is shared across all companies (no `company_id` column). Per-
company materialization (eager seed) is a separate plan that consumes this
catalog.