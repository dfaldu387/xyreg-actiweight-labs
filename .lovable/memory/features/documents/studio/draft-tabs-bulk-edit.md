---
name: Draft tabs bulk edit
description: Open-tab strip in DocumentDraftDrawer supports multi-select with amber bar to bulk-edit CI metadata across drafts
type: feature
---
- Tab strip checkbox selects drafts; amber bar shows count + "Bulk edit" + "Clear" (matches selection-first amber pattern).
- `BulkDraftEditDialog` writes ticked fields to `phase_assigned_document_template` per selected CI id.
- Supported fields: authors_ids, reviewer_group_ids, change_control_ref, tags, next_review_date, status, document_type.
- Authors / reviewer groups / tags have Add-vs-Replace mode toggle (Add fetches current rows and merges).
- On apply, dispatches `xyreg:ci-metadata-bulk-updated` window event so any open drawer can refetch.

## Tab Groups
- `document_draft_tab_groups` table stores named sets of draft CI ids per company; owner sees own + shared, only owner edits.
- Validation trigger blocks members not belonging to the group's company.
- `DraftTabGroupsMenu` (folder dropdown at start of tab strip) lists groups → opens all members as tabs and pre-selects them so amber "Bulk edit" is one click away.
- `SaveDraftTabGroupDialog` triggered from amber bar "Save as group…" — name, color, scope (selected vs all open), share toggle.
- `openDraftsByIds` in `CompanyDocumentManager` looks up CI ids from cached `documents`, falls back to a `phase_assigned_document_template` query for missing ones, dedupes against already-open tabs.
