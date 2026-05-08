## Plan: Foundation SOP correction + CCR description sync

Two independent fixes addressing what you saw on `/change-control/a1fa29dd-…`.

---

### Part 1 — Fix the Foundation SOP set

**Problem.** SOPs that should be universal (Risk Management, UDI, Identification & Traceability) are classified as Tier B `'always'` triggers, so they're not auto-seeded at company onboarding. SOP-002 Document Control IS in Tier A but renders below the fold, which made it look missing.

**Change.** In `src/constants/sopAutoSeedTiers.ts`, promote three SOPs from Tier B → Tier A:

| SOP | Title | Current | New |
|---|---|---|---|
| SOP-015 | Risk Management (ISO 14971) | Tier B (`always`) | **Tier A** |
| SOP-019 | Identification, Traceability & UDI | Tier B (`always`) | **Tier A** |
| SOP-045 | UDI Management | Tier B (`always`) | **Tier A** |

Result: foundation grows from 28 → **31 SOPs**. All three are mandatory under ISO 13485 / EU MDR / 21 CFR 820 regardless of pathway, so the `'always'` trigger was a tell that they were misclassified.

**Files touched**
- `src/constants/sopAutoSeedTiers.ts` — move three entries, add justification strings.
- `mem://features/sop/tiered-auto-seed-classification` — update count from 28 to 31, list new entries.

**Backfill for existing companies.** New companies get them automatically. For existing companies (like David Health Solutions Oy), add a one-time idempotent backfill via the existing seed routine. Two options to pick at implement time, but default: surface a "Seed missing foundation SOPs (3)" banner in Document Control when any of the three are absent, so admins opt in rather than auto-mutating their QMS.

---

### Part 2 — CCR description ↔ Connected Documents reconciliation

**Problem.** The CCR `description` / `scope` field is authored once (often AI-assisted) and then drifts as users add/remove documents on the Documents tab. The text can reference docs that are no longer linked, or omit ones that were added later.

**Change.** Two-layer fix:

**(a) Drift detection (read-only badge).**
- Add a lightweight `useCCRDescriptionDrift(ccrId)` hook that:
  - tokenises the `description` for SOP/document references (regex: `SOP-[A-Z]{0,3}-?\d{3}`, document_reference patterns)
  - compares against the live `change_control_affected_documents` set
  - returns `{ missing: string[], stale: string[] }`
- In `ChangeControlDetailPage.tsx`, render an amber pill next to the description: **"Description out of sync — N referenced doc(s) no longer linked, M linked doc(s) not mentioned"** with a "Refresh from linked documents" action.

**(b) Refresh action (Draft only).**
- Button calls a new `regenerateCCRDescriptionFromLinkedDocs(ccrId)` service that:
  - fetches all `change_control_affected_documents` rows joined to `documents`
  - calls the existing Gemini AI assist (already wired via `AiAssistPopover`) with a deterministic prompt: *"Rewrite this CCR scope so every linked document is referenced and no unlinked doc is mentioned. Preserve the original change rationale."*
  - opens the result in the existing inline EditableText with diff preview (no auto-write — user confirms)
- Restricted to CCRs in `Draft` status (matches existing edit gating on line ~70).

**Files touched**
- New `src/hooks/useCCRDescriptionDrift.ts`
- New service method in `src/services/ccrLinkedDocsService.ts`: `extractReferencedDocs(description)` + `regenerateCCRDescriptionFromLinkedDocs(ccrId)`
- `src/pages/ChangeControlDetailPage.tsx` — render drift badge + action button next to description block.
- Mission Control surface: per the core rule "any flag must also surface in Mission Control" — add CCRs with description drift to the existing CCR widget as a sub-status pill.

**No DB schema changes.** Pure frontend + service layer.

---

### Out of scope (call out, don't build)
- Promoting Tier B `manufacturing`-triggered SOPs (017, 018, 043, 051) — these genuinely depend on whether the company manufactures.
- Auto-rewriting the description without user confirmation — drift detection is advisory only.
- Renumbering SOPs to remove the gap between 002 and the rest of the list (would break audit trails).
