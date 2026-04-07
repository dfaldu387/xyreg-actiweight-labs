

## Plan: Add location tags + fix device doc deep-link

### A) Add location tags to My Documents widget

**Problem**: Each document in the widget shows only its name, type, and timestamp — no indication of whether it belongs to an enterprise (company) document or a specific device/product.

**Fix in `src/components/mission-control/MyDocumentsWidget.tsx`**:
- After fetching documents, collect all unique `product_id` values and batch-fetch product names from `products` table (`id`, `name`, `current_lifecycle_phase`)
- Add `productName` and `phaseName` fields to the `DocItem` interface
- Render a small muted tag below each doc's metadata line:
  - If `productId` exists: show `"{productName} | {phaseName}"` (or just product name if no phase)
  - If no `productId`: show `"Enterprise"` 

### B) Fix device doc deep-link not opening the CI drawer

**Problem**: Navigating to `/app/product/{id}/documents?docId={id}` lands on the documents list but the `docId` query param is never consumed — the deep-link auto-open logic only exists in `CompanyDocumentManager` (enterprise docs), not in `ProductDocumentsPage`.

**Fix in `src/pages/ProductDocumentsPage.tsx`**:
- Add a `useEffect` that reads `searchParams.get('docId')`, finds the matching document in the loaded `documents` array, and sets it as `newlyCreatedDoc` (which the `DocumentTabs`/`AllActivePhasesTab` already use to auto-open the drawer)
- Clear the `docId` param from the URL after consumption (same pattern as `CompanyDocumentManager`)

### Files
1. `src/components/mission-control/MyDocumentsWidget.tsx` — add product name fetch, add `productName`/`phaseName` to DocItem, render location tag
2. `src/pages/ProductDocumentsPage.tsx` — add `docId` deep-link useEffect to auto-open document drawer

