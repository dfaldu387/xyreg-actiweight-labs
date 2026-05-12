# Add a persistent "Upload .docx" action in the draft editor

## Problem
Today, importing a `.docx` is only offered inside the **DraftEmptyStateModal** ("How do you want to start?") that appears when you first open an empty draft. Once that modal is dismissed, or once a template auto-loads its placeholder skeleton (Purpose / Scope / References / Issued By table — exactly what you see in your screenshot), there is **no button anywhere** in the LiveEditor to upload a Word file. The hidden `<input type="file">` and the `handleDocxFileSelected` handler exist, but nothing triggers them.

## Goal
Make "Upload .docx" reachable at any time while editing a draft, not just from the initial chooser.

## Plan

1. **Lift the hidden file input out of the empty-state guard** in `LiveEditor.tsx` so it is always mounted (currently it lives inside the `!disableEmptyStatePrompt` block).

2. **Add an "Upload .docx" toolbar button** in the editor toolbar (the row with B / I / S / link / H1-H3 / lists / Image / Size / table). Place it next to the existing **Image** button, using the `Upload` icon from lucide-react and a tooltip "Import from Word (.docx)". Clicking it triggers the same `handleEmptyStateUploadDocx` flow that the modal uses.

3. **Also expose it in the empty-state modal as today** — no change to that modal, just keep parity.

4. **Confirmation guard**: if the editor already has user content, show a small `confirm()` ("Replace current content with the uploaded document?") before importing, to avoid accidental overwrites of placeholder edits.

5. No backend or schema changes.

## Files touched
- `src/components/document-composer/LiveEditor.tsx` — move the hidden `<input>` outside the empty-state block, add the toolbar button + confirm guard.

## Out of scope
- Changing the import/parse logic (`docxToSections.ts` stays as-is).
- Changing the empty-state modal copy (already updated previously).
