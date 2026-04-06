

## Plan: Fix TF-Document Studio Disconnect & Add CI Creation Dialog

### Problem Summary

Two critical issues:

1. **Document in TF drawer ≠ Document in Doc Studio**: The `createTFDocument` service saves the studio draft with `template_id = templateKey` (e.g., `TF-0-a`), but old data has the double-prefix bug (`TF-TF-0-a`). When navigating from Document Studio URL (`?templateId=TF-TF-0-a`), the lookup finds the correct draft. But from the TF drawer, the lookup uses the CI UUID first, which doesn't match the studio draft's `template_id`. The two are disconnected.

2. **No CI creation dialog**: Currently "Create Document" auto-creates everything silently. User wants it to first show the `SaveContentAsDocCIDialog` (or similar) so they can choose where to save (enterprise/device/phase), then proceed.

### Changes

**File 1: `src/pages/ProductTechnicalFilePage.tsx`**

- **Replace auto-create with dialog flow**: When clicking "Create Document" (FileEdit button), instead of calling `createTFDocument` directly:
  1. Store the pending substep info in state (description, sectionId, letter)
  2. Open a `SaveContentAsDocCIDialog` with a placeholder section content
  3. On `onDocumentCreated` callback: link the new CI to the TF section via `technical_file_document_links`, invalidate queries, and open the draft drawer

- **Add state**: `pendingTFDoc` state to hold the substep info for the dialog
- **Add the dialog** to the JSX, passing `companyId`, `productId`, `templateIdKey = TF-{section}-{letter}`
- **On document created callback**: Insert into `technical_file_document_links`, invalidate queries, open drawer

**File 2: `src/services/technicalFileDocService.ts`**

- **Simplify**: The `createTFDocument` function can be reduced or repurposed. The heavy lifting (studio save + CI sync) is now handled by `SaveContentAsDocCIDialog`. We still need a helper to:
  - Build the initial content (placeholder or AI-generated) 
  - Save it to `document_studio_templates` before opening the dialog
  - Or: let the dialog handle save, then trigger AI generation in the background after

- **New approach**: Create a lighter `prepareTFDocumentContent` function that returns the initial HTML content and metadata, used by the dialog's `htmlContent` prop. After the dialog creates the CI, fire-and-forget AI generation to update the studio draft.

**File 3: `src/components/shared/SaveContentAsDocCIDialog.tsx`** (minor)

- No changes needed — it already supports the full flow (scope selection, CI creation, studio save).

### Flow After Fix

1. User clicks "Create Document" in TF section
2. `SaveContentAsDocCIDialog` opens with pre-filled title and placeholder content
3. User selects scope (Enterprise / Device / Phase) and clicks "Create Document"
4. Dialog saves to Document Studio + creates CI record
5. Callback fires: links CI to TF section, opens draft drawer with correct `documentReference`
6. AI generation runs in background to enrich the content
7. Both TF drawer and Document Studio now reference the same draft via the same `template_id`

### Summary
- 2 files changed (ProductTechnicalFilePage.tsx, technicalFileDocService.ts)
- Replaces silent auto-creation with proper CI creation dialog
- Ensures TF and Document Studio share the same document identity
- AI generation still runs in background after CI creation

