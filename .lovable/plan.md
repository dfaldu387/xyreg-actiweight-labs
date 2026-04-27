# Three Document List / Draft Editor Fixes

Three independent issues, all narrowly scoped.

## a) Default rows per page → 20

**File**: `src/components/documents/CompanyDocumentListView.tsx`

The list defaults to 10 rows. Change the default to **20** in three coordinated spots so URL state, initial state, and the "is default? then strip from URL" check all agree:

- `parseInt(searchParams.get(...PAGE_SIZE) || '10', 10)` → `'20'` (lines 150 & 196)
- `newPagination.pageSize !== 10 ? ... : null` → `!== 20` (line 252)

The Select dropdown already offers `[10, 20, 30, 50, 100]`, so no UI change needed. Existing URLs that explicitly set `pageSize=10` keep working.

## b) Prefix font size jumps inside Edit Draft header

**Problem**: In the list ("SOP-017 Production…"), the prefix is rendered as a small monospace muted badge while the title is normal-weight. When you open the draft, the drawer header puts the entire string `"SOP-014 Clinical Evaluation"` inside a single `<Typography variant="h6">`, so the prefix inflates to the same large size as the title (visible in screenshot 2: "Edit Draft — SOP-014 Clinical Evaluation").

**File**: `src/components/product/documents/DocumentDraftDrawer.tsx` (around line 1111–1120)

Replace the single-string title with a structured render that separates the action label, the prefix, and the document title. Use the same visual hierarchy as the list cell (small monospace muted prefix + normal-weight title).

Sketch:

```tsx
<Typography variant="h6" noWrap component="div" sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
  <span>
    {activeView === 'review' ? 'Review & Approve' :
     activeView === 'completed' ? 'Completed' :
     showAdvancedEditor ? 'Advanced Editor' :
     existingDraftId ? 'Edit Draft' : 'Create Draft'} —
  </span>
  {/* Split documentName into prefix + title */}
  {(() => {
    const { prefix, title } = splitDocPrefix(documentName);
    return (
      <>
        {prefix && (
          <span style={{ fontFamily: 'monospace', fontSize: '0.75em', color: 'var(--mui-palette-text-secondary)', fontWeight: 400 }}>
            {prefix}
          </span>
        )}
        <span>{title}</span>
      </>
    );
  })()}
</Typography>
```

Add a tiny helper `splitDocPrefix(name)` (or reuse the existing `stripDocPrefix` in `src/utils/templateNameUtils.ts` — extend it to return both halves) that matches a leading `^([A-Z]+(-[A-Z]+)?-\d+)\s+(.*)$` token. Falls back to `{ prefix: '', title: name }` for names without a prefix.

## c) Sub-prefixes (e.g. SOP-CL-014) not shown in list / draft

**Background** (per `mem://features/documents/numbering/functional-sub-prefixes`): sub-prefix is **display-only** — internal storage stays `SOP-NNN`. `formatSopDisplayName()` and `formatSopDisplayId()` already exist in `src/constants/sopAutoSeedTiers.ts` and are applied in 3 places (CompanyDocumentCard, TemplateManagementTab, SOPTemplatePreviewDialog — see screenshot 3 where it works correctly), but **not** in the company document list or the draft drawer header — that's why the list shows "SOP-014" instead of "SOP-CL-014".

### Fixes

**1. `src/components/documents/CompanyDocumentListView.tsx`** — Name column cell (~line 304–333):

In the cell renderer, transform the prefix through `formatSopDisplayId` before rendering the small mono badge:

```tsx
import { formatSopDisplayId, formatSopDisplayName } from '@/constants/sopAutoSeedTiers';
…
const displayDocNumber = docNumber ? formatSopDisplayId(docNumber) : null;
// fallback for rows where the prefix is embedded in `name` (no document_number column):
const displayCleanName = !docNumber ? formatSopDisplayName(cleanName) : cleanName;
```

Render `displayDocNumber` in the small-mono span and `displayCleanName` (or `cleanName` when prefix already extracted) as the title. Also update the `accessorFn` (line 286) and the tooltip's `displayName` (line 312) to use the formatted values so sorting and tooltip stay consistent.

**2. `src/components/product/documents/DocumentDraftDrawer.tsx`** — title (combined with fix b):

Run `documentName` through `formatSopDisplayName` before splitting, so "SOP-014 Clinical Evaluation" becomes "SOP-CL-014 Clinical Evaluation" in the drawer header.

### Out of scope

- We are **not** changing what's stored in the database (`name`, `document_number`). The mapping stays display-only, matching the established pattern.
- `formatSopDisplayId` already returns the input untouched for unmapped/custom SOPs, so non-Xyreg SOPs and non-SOP documents are unaffected.

## Review checklist

- List view defaults to 20 rows; existing `?pageSize=10` URLs still work.
- Edit Draft header prefix is small-monospace and muted (matches list visual).
- "SOP-014 Clinical Evaluation" → displayed as `SOP-CL-014 Clinical Evaluation` in:
  - Company document list (screenshot 1 area)
  - Edit Draft drawer header (screenshot 2 area)
  - Already correct in Templates tab (screenshot 3) — unchanged.
- Custom (non-Xyreg) SOPs without sub-prefix mapping render unchanged.
