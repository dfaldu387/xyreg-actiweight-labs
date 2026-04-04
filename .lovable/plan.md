

## Plan: Add document selection to File Sections + filter Market Approvals by product markets

### Problem
1. **File Sections tab** shows empty sections with no way to link documents — users need to be able to choose which CI documents belong to each TF section
2. **Market Approvals tab** shows all markets across the company instead of only the markets selected for this specific product in Device Definition

### Changes

**1. File Sections — Add document linking (`ProductTechnicalFilePage.tsx`)**

- Add a "Link Documents" button to each TF section
- Clicking opens a dialog/popover listing the product's `phase_assigned_document_template` documents (already used across the app)
- Users can check/uncheck documents to assign them to a TF section
- Store the mapping: add a `technical_file_section` column to `phase_assigned_document_template` (e.g. `'TF-0'`, `'TF-7'`), OR create a lightweight junction table `technical_file_document_links(id, product_id, section_id, document_id)`
- The junction table approach is cleaner — doesn't pollute the document template table with TF-specific data
- Each section then queries its linked documents and displays them with status badges

**New migration: `technical_file_document_links` table**
```sql
CREATE TABLE public.technical_file_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,  -- e.g. 'TF-0', 'TF-7'
  document_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, section_id, document_id)
);
ALTER TABLE public.technical_file_document_links ENABLE ROW LEVEL SECURITY;
-- RLS via product → company → user_company_access
```

**2. Market Approvals — Filter by product markets (`ProductTechnicalFilePage.tsx`)**

- Instead of `useAvailableMarkets(companyId)` (all company markets), query this specific product's `markets` column from the `products` table
- Parse the product's markets JSON (same format handling as `useAvailableMarkets`) and only show those
- If the product has no markets configured, show a message: "No target markets configured. Set markets in Device Definition."

**3. New component: `TechnicalFileDocumentPicker` dialog**
- A simple dialog with a checkbox list of the product's documents from `phase_assigned_document_template`
- Grouped or searchable for usability
- On save, inserts/deletes rows in `technical_file_document_links`

### Files
| File | Action |
|------|--------|
| `supabase/migrations/...` | Create `technical_file_document_links` table |
| `src/pages/ProductTechnicalFilePage.tsx` | Replace `useAvailableMarkets` with product-specific markets query; update `TechnicalFileSectionsTab` to query linked docs per section and add "Link Documents" button |
| `src/components/technical-file/TechnicalFileDocumentPicker.tsx` | New — dialog for selecting documents per TF section |

