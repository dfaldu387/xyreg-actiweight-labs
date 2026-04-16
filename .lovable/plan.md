

## Plan: Change "Edit Doc" Icon Color to Yellow When Draft Exists

### Problem
The `FileEdit` icon in the Quality Manual sidebar header (top-right) is always gray (`text-muted-foreground`). The user wants it to turn yellow once a draft document has been created, providing visual feedback that a draft is in progress.

### Approach
1. **Add a proactive draft-existence check** to `QualityManualSidebar.tsx` using a `useEffect` that calls `DocumentStudioPersistenceService.getDocumentCIsByReference` on mount with the `QM-FULL-{companyId}` key.
2. **Store the result** in a `draftExists` boolean state.
3. **Conditionally color the icon**: when `draftExists` is true, apply `text-amber-500` (yellow) instead of `text-muted-foreground`. Also update the tooltip text to "Open Document Draft".

### File changed
- `src/components/quality-manual/QualityManualSidebar.tsx`
  - Add `useEffect` + `useState` to check if a CI record exists for `templateIdKey` on mount
  - Change the icon button class from `text-muted-foreground` to `text-amber-500` when `draftExists` is true
  - Update tooltip text conditionally

### Scope
- 1 file, ~10 lines added/changed

