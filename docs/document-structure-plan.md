# Document Structure Improvement Plan

## Executive Summary

The current document system has inconsistencies between "Phase Documents" and "Core Documents" that cause confusion in both the UI and data management. This plan outlines the current state, problems, and proposed solutions.

---

## 1. Current State Analysis

### 1.1 Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `documents` | Main unified documents table | `document_scope`, `phase_id`, `product_id`, `template_source_id` |
| `phase_assigned_document_template` | Company-level phase templates | `document_scope`, `phase_id`, `product_id` |
| `company_phases` | Company's phase definitions | `id`, `name`, `company_id` |
| `lifecycle_phases` | Product lifecycle milestones | `product_id`, `phase_id`, `start_date`, `end_date` |

### 1.2 Document Scope Values

```
document_scope ENUM:
├── "company_template"  → Company-level phase templates (shared across products)
├── "company_document"  → Company-level standalone documents
└── "product_document"  → Product-specific documents
```

### 1.3 Current Document Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY LEVEL                                 │
├─────────────────────────────────────────────────────────────────┤
│  phase_assigned_document_template                               │
│  ├── document_scope = "company_template"                        │
│  ├── phase_id = Company phase ID                                │
│  └── Shared across ALL products                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (instantiation)
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT LEVEL                                 │
├─────────────────────────────────────────────────────────────────┤
│  documents table                                                 │
│  ├── Phase Documents (template-based):                          │
│  │   ├── document_scope = "product_document"                    │
│  │   ├── template_source_id = reference to company template     │
│  │   └── phase_id = Phase ID                                    │
│  │                                                               │
│  └── Core/Product-Specific Documents:                           │
│      ├── document_scope = "product_document"                    │
│      ├── template_source_id = NULL                              │
│      └── phase_id = NULL or optional                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Current Problems

### 2.1 UI/UX Issues

| Problem | Description | Location |
|---------|-------------|----------|
| **Misleading Count** | "Phase Documents (12)" shows phase count, not document count | DocumentViewSelector.tsx |
| **Confusing Labels** | "Phase Documents" vs "Core Documents" naming is unclear | DocumentViewSelector.tsx |
| **Count Mismatch** | Core Documents shows 141 but includes various document types | DocumentTabs.tsx |

### 2.2 Data Issues

| Problem | Description | Impact |
|---------|-------------|--------|
| **Dual Table Fetch** | `usePhaseDocuments` fetches from both `phase_assigned_document_template` AND `documents` tables | Potential duplicates |
| **Nullable document_scope** | `document_scope` can be NULL | Documents may not appear in correct views |
| **Inconsistent Filtering** | Different components use different criteria for "product-specific" | Data leakage between views |
| **No Clear Separation** | Phase documents and core documents share same table with only field differences | Hard to query and maintain |

### 2.3 Code Inconsistencies

```typescript
// ProductSpecificDocumentsTab.tsx - Excludes template-based
!doc.template_source_id && doc.document_scope === 'product_document'

// usePhaseDocuments.ts - Includes both scopes
.in("document_scope", ["company_template", "product_document"])

// DocumentTabs.tsx - Different validation for "core"
doc.document_type === 'Core' || doc.name.startsWith('Core:')
```

---

## 3. Proposed Solution

### 3.1 Clear Document Categorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW DOCUMENT TYPES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PHASE DOCUMENTS (Lifecycle Documents)                        │
│     ├── Source: Company phase templates                          │
│     ├── Must have: phase_id                                      │
│     ├── Created from: template_source_id (required)              │
│     └── Purpose: Track regulatory compliance per phase           │
│                                                                  │
│  2. PRODUCT DOCUMENTS (Custom Documents)                         │
│     ├── Source: Created directly for product                     │
│     ├── phase_id: Optional (can be assigned to phase or not)     │
│     ├── template_source_id: NULL                                 │
│     └── Purpose: Product-specific documentation                  │
│                                                                  │
│  3. COMPANY TEMPLATES (Not shown at product level)               │
│     ├── Source: Company-level definitions                        │
│     ├── document_scope: "company_template"                       │
│     └── Purpose: Template definitions only                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Database Schema Improvements

#### Option A: Add document_type field (Recommended - Minimal Changes)

```sql
-- Add explicit document type for clarity
ALTER TABLE documents
ADD COLUMN document_category VARCHAR(50) DEFAULT 'product';

-- Values: 'phase_instance', 'product_custom', 'core'

-- Update existing data
UPDATE documents
SET document_category = 'phase_instance'
WHERE template_source_id IS NOT NULL AND phase_id IS NOT NULL;

UPDATE documents
SET document_category = 'product_custom'
WHERE template_source_id IS NULL AND document_scope = 'product_document';
```

#### Option B: Separate Tables (More Invasive)

```sql
-- Create dedicated table for phase document instances
CREATE TABLE phase_document_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES phase_assigned_document_template(id),
  product_id UUID REFERENCES products(id),
  phase_id UUID REFERENCES company_phases(id),
  status VARCHAR(50) DEFAULT 'Not Started',
  -- ... other instance-specific fields
  CONSTRAINT unique_template_product UNIQUE (template_id, product_id)
);

-- Keep documents table for custom/product documents only
```

### 3.3 Recommended Database Structure (Option A Implementation)

```sql
-- documents table with clear categorization
documents (
  id UUID PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  company_id UUID NOT NULL,
  product_id UUID,
  phase_id UUID,

  -- Categorization fields
  document_scope ENUM('company_template', 'company_document', 'product_document') NOT NULL,
  document_category ENUM('phase_instance', 'product_custom') NOT NULL,

  -- Template relationship
  template_source_id UUID REFERENCES phase_assigned_document_template(id),

  -- Status and metadata
  status VARCHAR(50) DEFAULT 'Not Started',
  document_type VARCHAR(100), -- 'Standard', 'Core', 'Record', etc.

  -- Constraints
  CONSTRAINT phase_instance_requires_template
    CHECK (document_category != 'phase_instance' OR template_source_id IS NOT NULL),
  CONSTRAINT phase_instance_requires_phase
    CHECK (document_category != 'phase_instance' OR phase_id IS NOT NULL)
);

-- Indexes for common queries
CREATE INDEX idx_documents_product_category ON documents(product_id, document_category);
CREATE INDEX idx_documents_phase ON documents(phase_id) WHERE phase_id IS NOT NULL;
CREATE INDEX idx_documents_template ON documents(template_source_id) WHERE template_source_id IS NOT NULL;
```

---

## 4. Implementation Plan

### Phase 1: Database Updates (Week 1)

#### 4.1.1 Add document_category field

```sql
-- Migration: Add document_category column
ALTER TABLE documents
ADD COLUMN document_category VARCHAR(50);

-- Set values based on existing data
UPDATE documents SET document_category =
  CASE
    WHEN template_source_id IS NOT NULL AND phase_id IS NOT NULL THEN 'phase_instance'
    WHEN template_source_id IS NULL AND document_scope = 'product_document' THEN 'product_custom'
    ELSE 'product_custom'
  END
WHERE document_scope = 'product_document';

-- Make non-nullable after migration
ALTER TABLE documents
ALTER COLUMN document_category SET NOT NULL;
```

#### 4.1.2 Update Supabase Types

```typescript
// types.ts - Add to Database["public"]["Enums"]
document_category: "phase_instance" | "product_custom"

// Update Documents type
export interface Document {
  // ... existing fields
  document_category: "phase_instance" | "product_custom";
}
```

### Phase 2: Update Hooks (Week 2)

#### 4.2.1 Update usePhaseDocuments.ts

```typescript
// Simplified query - only fetch phase instances
const { data: phaseInstances } = await supabase
  .from("documents")
  .select("*")
  .eq("product_id", productId)
  .eq("document_category", "phase_instance")
  .not("phase_id", "is", null);
```

#### 4.2.2 Create useProductCustomDocuments.ts

```typescript
// New hook for product custom documents
export function useProductCustomDocuments(productId: string) {
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("product_id", productId)
    .eq("document_category", "product_custom");

  return { documents: data };
}
```

### Phase 3: Update UI Components (Week 3)

#### 4.3.1 Update DocumentViewSelector.tsx

```typescript
// Change labels and counts
const views = [
  {
    id: "phase-documents",
    label: "Phase Documents",
    description: "Documents from lifecycle templates",
    count: phaseDocumentCount, // Actual document count, not phase count
    icon: Layers
  },
  {
    id: "custom-documents",
    label: "Custom Documents",
    description: "Product-specific documents",
    count: customDocumentCount,
    icon: FileText
  }
];
```

#### 4.3.2 Update DocumentTabs.tsx

```typescript
// Simplified count calculation
const phaseDocumentCount = useMemo(() => {
  return documents.filter(d => d.document_category === 'phase_instance').length;
}, [documents]);

const customDocumentCount = useMemo(() => {
  return documents.filter(d => d.document_category === 'product_custom').length;
}, [documents]);
```

### Phase 4: Testing & Validation (Week 4)

- [ ] Verify all existing documents are correctly categorized
- [ ] Test document creation flows
- [ ] Validate filter functionality
- [ ] Check document counts match between views
- [ ] Performance testing on large document sets

---

## 5. Migration Strategy

### 5.1 Data Migration Script

```typescript
// migration-script.ts
async function migrateDocumentCategories() {
  const { data: documents } = await supabase
    .from('documents')
    .select('id, template_source_id, phase_id, document_scope')
    .eq('document_scope', 'product_document');

  for (const doc of documents) {
    const category = doc.template_source_id && doc.phase_id
      ? 'phase_instance'
      : 'product_custom';

    await supabase
      .from('documents')
      .update({ document_category: category })
      .eq('id', doc.id);
  }
}
```

### 5.2 Rollback Plan

```sql
-- If needed, rollback by removing column
ALTER TABLE documents DROP COLUMN document_category;
```

---

## 6. UI Changes Summary

### Before

| Tab | Label | Shows |
|-----|-------|-------|
| Tab 1 | "Phase Documents (12)" | Phase count (confusing) |
| Tab 2 | "Core Documents (141)" | Mixed document types |

### After

| Tab | Label | Shows |
|-----|-------|-------|
| Tab 1 | "Phase Documents (87)" | Actual count of phase template instances |
| Tab 2 | "Custom Documents (54)" | Product-specific custom documents |

---

## 7. API Changes

### 7.1 New API Endpoints (if needed)

```typescript
// GET /api/products/:productId/documents/phase
// Returns only phase_instance documents

// GET /api/products/:productId/documents/custom
// Returns only product_custom documents

// GET /api/products/:productId/documents/stats
// Returns counts for each category
{
  "phase_instance": 87,
  "product_custom": 54,
  "total": 141
}
```

---

## 8. Files to Modify

### High Priority
- [ ] `src/integrations/supabase/types.ts` - Add document_category type
- [ ] `src/hooks/usePhaseDocuments.ts` - Update query logic
- [ ] `src/components/product/documents/DocumentTabs.tsx` - Fix count calculation
- [ ] `src/components/product/documents/DocumentViewSelector.tsx` - Update labels

### Medium Priority
- [ ] `src/components/product/documents/AllActivePhasesTab.tsx` - Use new category
- [ ] `src/components/product/documents/ProductSpecificDocumentsTab.tsx` - Rename & update
- [ ] `src/hooks/useProductDocuments.tsx` - Add category filter

### Low Priority
- [ ] `src/api/unifiedDocumentsApi.ts` - Add category support
- [ ] `src/api/phaseDocumentsApi.ts` - Update queries

---

## 9. Success Criteria

1. **Accurate Counts**: Document counts match actual documents in each view
2. **Clear Separation**: No document appears in both views
3. **Consistent Filtering**: Filters work correctly in both views
4. **No Data Loss**: All existing documents remain accessible
5. **Performance**: No degradation in query performance

---

## 10. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Database Updates | 3-4 days | None |
| Hook Updates | 2-3 days | Database |
| UI Updates | 3-4 days | Hooks |
| Testing | 2-3 days | All above |
| **Total** | **~2 weeks** | |

---

## 11. Open Questions

1. Should "Core Documents" be renamed to "Custom Documents" or "Product Documents"?
2. Should phase documents without a product be shown in a separate view?
3. Do we need backward compatibility for API responses?
4. Should document_category be editable by users or system-managed only?

---

## Appendix A: Current Code References

### Key Files
- `src/hooks/usePhaseDocuments.ts` - Lines 88-281 (dual fetch logic)
- `src/components/product/documents/DocumentTabs.tsx` - Lines 353-407 (count calculation)
- `src/components/product/documents/DocumentViewSelector.tsx` - Lines 36-46 (view options)
- `src/integrations/supabase/types.ts` - Lines 5140+, 9580+, 20211+ (type definitions)

### Database Enum Definition
```typescript
// Current document_scope values (types.ts line 20443-20447)
document_scope: "company_template" | "company_document" | "product_document"
```
