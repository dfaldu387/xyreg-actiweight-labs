---
name: Document derivative actions
description: Translate and Work Instruction derivations from Configure panel. Foundational SOPs use a shared global WI catalog; custom SOPs use per-company AI generation with auto-detected modules.
type: feature
---
The Configure panel (DocumentConfigPanel) hosts two AI-powered derivative actions above CIPropertyPanel:

- **TranslateSection** — picks one of 15 EU/MDR languages, calls `translate-document` edge function (Vertex AI Gemini). Creates a new CI with suffix `-<LANG>` on the document number, flags `ai_translated=true` and `needs_review=true`. Source CI's `language_variants` JSONB tracks all translations.
- **Work Instruction derivation** — branches on SOP tier (via `getSopTier` from `sopAutoSeedTiers`):
  - **Tier-A foundational SOPs** → `LinkedWorkInstructionsSection` lists shared global WIs from `global_work_instructions` table. Opening one calls `materializeGlobalWIForCompany` which creates a per-company CI + Studio draft on first open and reuses it after. No per-company AI generation.
  - **Custom / non-foundational SOPs** → `GenerateWorkInstructionSection`. No module checkboxes — the `generate-work-instruction` edge function auto-detects XyReg modules from SOP content using a tool-call to Gemini, then generates the WI grounded in `XYREG_FEATURE_MAP`. UI surfaces the auto-detected modules in the success toast.

Both fire `window` event `xyreg:open-draft-by-id` on success; CompanyDocumentManager listens and reuses `openDraftsByIds` to open the new doc as an adjacent tab in the drawer.

DB columns on `phase_assigned_document_template`: `language`, `ai_translated`, `needs_review`, `derived_from_ci_id`, `derivation_type` (`translation` | `work_instruction`), `language_variants` (jsonb map), `derived_work_instructions` (uuid[]).

Edge functions use the shared `_shared/lovable-ai.ts` helper. The XyReg feature map is duplicated at `supabase/functions/_shared/xyregFeatureMap.ts` for Deno use.

**WI section template (v2 — Best Practice):** every generated WI (global catalog and per-company) emits 7 sections:
1. Scope · 2. Roles · 3. Procedure (with inline `wi-note` / `wi-caution` callouts and a top-of-procedure block for system-wide cautions) · 4. Acceptance Criteria · 5. Reference · 6. **Approval & Change Control** (Version 1.0 carries `CCR-PENDING` placeholder until a CCR is linked; subsequent revisions require a new CCR per SOP-006) · 7. **Document Authority Notice** (Master Record resides in Xyreg; printed/exported copies are uncontrolled). The AI prompt instructs the model to surface immutable-field / signature-lock / irreversible-action gotchas as `caution` strings on the relevant step. `DocumentRichContentView` styles `.wi-note` (blue) and `.wi-caution` (amber) callouts.

Global catalog tables:
- `global_work_instructions` — service-role-write, authenticated-read. Keyed by `sop_template_key` (e.g. `SOP-001`). One row per (sop_key, wi_number, version).
- `global_wi_company_materializations` — bookkeeping so each (global_wi_id, company_id) only materializes one CI.

Seeding: `seed-global-work-instructions` edge function accepts `{ sops: [{key,title,sections,subPrefix}], wisPerSop, replace }`. Triggered from Document Control via the "Generate WIs" button on `SopAutoSeedStatus`, which posts canonical content from `SOP_FULL_CONTENT`. For each SOP it (1) detects modules, (2) proposes N distinct task focuses, (3) generates one WI per focus.