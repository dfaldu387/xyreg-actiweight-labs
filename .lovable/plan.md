## Problem

The FPD Catalog tab currently only shows metadata (title, rationale, trigger, active toggle). The actual Foundation SOP templates already exist as fully-authored, sectioned content in `src/data/sopContent/sop001to010.ts` … `sop041to051.ts` (SOP-001 through SOP-051, each with 8 sections: Purpose, Scope, References, Definitions, Responsibilities, Procedure, Records, Revision History). A modal popup exposing only `title` adds no value when the real authoring substance lives in those section bodies.

We need to make the FPD Catalog the actual editing surface for those template bodies — directly, with a lightweight side drawer (no review/approve, no signatures, no CI lifecycle). This is Super Admin master content, not a regulated document instance.

## Solution: Section-level editor in a side drawer

### 1. Persist the body in the catalog

Add a `default_sections` JSONB column to `fpd_sop_catalog` (mirrors the existing `SOPSectionContent[]` shape: `{ id, title, content }[]`). One-time backfill from `SOP_FULL_CONTENT` so all 51 rows ship with the current canonical content. The hardcoded files become read-only fallbacks; the DB row is the SSOT.

### 2. Replace the Edit modal with a right-side drawer

Click "Edit" (or anywhere on the row) → opens a `Sheet` (right side, `w-[720px]`) instead of the current `Dialog`. The drawer contains:

```text
┌─────────────────────────────────────────────────┐
│ SOP-001  [Foundation]            [Save] [×]    │
│ Quality Management System                       │
│ ─────────────────────────────────────────────── │
│ Title         [Quality Management System    ]  │
│ Rationale     [QMS skeleton — ISO 13485…    ]  │
│ Trigger       [always]            Active [✓]   │
│ ─────────────────────────────────────────────── │
│ SECTIONS                              [+ Add]  │
│  ▸ 1.0 Purpose                          [edit] │
│  ▸ 2.0 Scope                            [edit] │
│  ▸ 3.0 References                       [edit] │
│  …                                              │
│  ▾ 6.0 Procedure                       [edit] │
│    ┌──────────────────────────────────────┐   │
│    │ [Section title input]                │   │
│    │ [Multi-line textarea — full body]    │   │
│    │                          [↑][↓][🗑]   │   │
│    └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Each section is a collapsible card (closed by default — opens on click).
- Inline title input + tall `Textarea` for the body. Plain text/markdown — no TipTap, no review chrome.
- Reorder via ↑/↓ buttons; delete with trash; add a new blank section with `+ Add`.
- Single `Save` writes back the whole `default_sections` array plus metadata in one update.
- "Reset to library default" link (small, muted) restores from `SOP_FULL_CONTENT[sop_key]` if the admin wants to revert.

Explicitly NOT included: review/approve workflow, signatures, version history UI, comments, CI numbering, status transitions. This is master content authoring.

### 3. Auto-seeding reads from DB first

`sopAutoSeedService` (and any other consumer) gets a small change: when seeding a new company instance, prefer `fpd_sop_catalog.default_sections` if non-empty; fall back to `SOP_FULL_CONTENT[sop_key]` otherwise. Existing companies are unaffected (matches current behavior — edits propagate to *future* onboardings only).

### 4. Row preview in the list

In the FPD Catalog list, add a small `· 8 sections` count next to the trigger badge so admins can see at a glance which entries have body content. Click anywhere on the row opens the drawer.

## Files

**Migration (new)**
- `ALTER TABLE fpd_sop_catalog ADD COLUMN default_sections JSONB NOT NULL DEFAULT '[]'::jsonb;`
- One-time UPDATE: for each of the 51 `sop_key`s, set `default_sections` = JSON of `SOP_FULL_CONTENT[sop_key].sections` (run via a seed edge function or inline SQL with a generated literal).

**TypeScript**
- `src/services/fpdSopCatalogService.ts` — add `default_sections: SOPSectionContent[]` to entry type, extend `update()` to accept it, add `resetToLibraryDefault(sopKey)` helper.
- `src/components/super-admin/FpdCatalogSection.tsx` — replace `Dialog` with `Sheet` from `@/components/ui/sheet`; show section count chip in row.
- `src/components/super-admin/FpdSopEditDrawer.tsx` (new) — the drawer with collapsible section cards, reorder/add/delete, save handler.
- `src/services/sopAutoSeedService.ts` — read `default_sections` from catalog row; fall back to `SOP_FULL_CONTENT`.

**No changes** to the existing template upload dialog, CI lifecycle, document studio, or any company-instance code. The bridge (`fpd_sop_key` on `default_document_templates`) keeps working as-is — file uploads still override the boilerplate when present; otherwise the new editable `default_sections` is used.

## Out of scope (intentional)

- No rich text editor — plain textarea per section keeps it fast and matches the tone of "master content, not a regulated draft."
- No diff against `SOP_FULL_CONTENT` — just a "Reset to library default" button.
- No bulk export/import of section content (can follow up if needed).
