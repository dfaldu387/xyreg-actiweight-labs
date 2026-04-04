# BOM Module Plan

## ✅ Complete

### Database
- `bom_revisions` — versioned BOMs per product (draft → active → obsolete)
- `bom_items` — line items with computed `extended_cost` (qty × unit_cost)
- `bom_revision_transitions` — audit trail
- `bom_revision_status` enum (draft, active, obsolete)
- RLS via `user_company_access`, indexes, updated_at triggers
- `is_archived`, `archived_at`, `archived_by` columns for soft-delete

### Service Layer
- `BomService` — full CRUD for revisions and items
- Revision activation with auto-obsolete of previous active
- Clone revision with item copy
- Cost rollup recalculation
- Soft-delete (archive) instead of hard delete for revisions
- `archiveRevision()`, `restoreRevision()`, `getArchivedRevisions()`

### UI Components
- `BomRevisionList` — table with status/cost/items, create/clone/archive
  - Archive confirmation dialog (AlertDialog) before archiving draft revisions
- `BomDetailPanel` — tabbed (Items | Cost Summary | History)
  - Inline add/edit/delete items (draft only)
  - Delete item confirmation dialog (AlertDialog)
  - Cost rollup display
  - Transition audit trail
- `ArchivedBomRevisions` — table in Archives page with restore capability

### Navigation
- Own top-level Device section in sidebar (Package icon)
- Route: `/app/product/:productId/bom`
- Sidebar description updated: Operations says "Manufacturing strategy, supply chain, and production"
- Archives page: "BOM Revisions" tab added

### Production Integration
- `production_orders.bom_revision_id` FK → `bom_revisions(id)`
- Create dialog: dropdown of active BOM revisions for the product
- Detail panel: new "BOM" tab showing linked revision items & costs
- DHR section: shows linked BOM revision info

### Environmental Compliance
- `rohs_compliant` and `reach_compliant` boolean columns on `bom_items`
- Three-state selectors in Add/Edit dialog (Not Assessed / Compliant / Non-Compliant)
- Green checkmark / red X / gray dash badges in items table
- Non-Compliant summary card in dashboard

### Technical Drawing Links
- `drawing_url` text column on `bom_items`
- URL input in Basic Info section of Add/Edit dialog
- Clickable external link icon next to description in items table

### CSV/Excel Bulk Import
- `BomImportDialog` component with 3-step flow (Upload → Map → Review)
- Drag-and-drop file zone, supports CSV and Excel (.xlsx/.xls)
- Auto-mapping dictionary for common header names
- Batch insert with auto-generated item numbers
- Accessible via "Import" button next to "Add Item" (draft only)

### Approval Visibility & Status Bar
- Draft status bar: "Working Draft — approved via Design Review or ECO"
- Active status bar: Green with CheckCircle2 icon: "✓ Approved — Rev X" + "Edit via ECO" button
- No standalone "Approve" button — approval flows through DR/ECO

### Cross-Device Item Scope
- `bom_item_product_scope` table (bom_item_id + product_id, unique constraint)
- `BomItemScopeService` — getScopes (batch), upsertScope
- `BomItemScopePopover` — popover with company product checkboxes
- "Scope" column in BOM items table (interactive in draft, read-only badge in active)
- Current product always checked and disabled

## Next Steps
- Import from Device Definition (pull components/materials into BOM items)
- Supplier linking (dropdown from approved suppliers)
- Mass Edit Mode (inline table editing for high-speed updates)
