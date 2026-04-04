# Document Table Consolidation Plan

## Executive Summary

This plan outlines the consolidation of two document tables (`documents` and `phase_assigned_document_template`) into a single unified `documents` table. This will simplify the codebase, reduce data inconsistencies, and improve maintainability.

**Current State:** 2 tables with overlapping data, ~105 files affected
**Target State:** 1 unified table, simplified queries, consistent data model

---

## 1. Current Architecture Analysis

### 1.1 Current Tables

#### Table 1: `phase_assigned_document_template`
- **Purpose:** Company-level phase templates and product phase documents
- **Records:** Phase-specific documents with required `phase_id`
- **Used in:** 36 files
- **Key Fields:** `phase_id` (required), `is_excluded`, `deadline`, `classes`, `markets`, `phases`

#### Table 2: `documents`
- **Purpose:** All types of documents (company, product, templates)
- **Records:** General documents, can have optional `phase_id`
- **Used in:** 83 files
- **Key Fields:** `template_source_id`, `platform_reference_id`, `platform_id`

### 1.2 Current Data Flow Problems

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CURRENT PROBLEMATIC FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Company Template Created                                                │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────────────────────┐                                   │
│  │ phase_assigned_document_template │ ◄── Template stored here          │
│  │ document_scope = 'company_template'                                   │
│  └──────────────────────────────────┘                                   │
│         │                                                                │
│         │ (instantiation - DUPLICATES DATA!)                            │
│         ▼                                                                │
│  ┌──────────────────────────────────┐                                   │
│  │         documents                 │ ◄── Instance stored here         │
│  │ document_scope = 'product_document'                                   │
│  │ template_source_id = template.id │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                          │
│  PROBLEMS:                                                               │
│  • Same document data in two tables                                      │
│  • Status updates happen in wrong table                                  │
│  • Queries need to check both tables                                     │
│  • Inconsistent field names and structures                               │
│  • Complex join logic in hooks                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Unified Table Design

### 2.1 New `documents` Table Schema

```sql
CREATE TABLE public.documents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Identification
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  product_id UUID REFERENCES products(id),
  phase_id UUID REFERENCES company_phases(id),

  -- Document Classification (NEW - replaces dual table logic)
  document_scope document_scope NOT NULL DEFAULT 'product_document',
  document_category TEXT NOT NULL DEFAULT 'custom',
  -- Values: 'template', 'phase_instance', 'custom', 'core'

  -- Template Relationship (for instances)
  parent_template_id UUID REFERENCES documents(id),
  -- Self-referencing: points to template document in same table

  -- Status & Workflow
  status TEXT DEFAULT 'Not Started',
  due_date TIMESTAMP WITHOUT TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITHOUT TIME ZONE,
  approval_date TIMESTAMP WITH TIME ZONE,

  -- Document Content
  description TEXT,
  brief_summary TEXT,
  document_type TEXT DEFAULT 'Standard',
  sub_section TEXT,
  document_reference TEXT,
  version TEXT,
  date TEXT,

  -- File Information
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  public_url TEXT,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE,
  uploaded_by UUID REFERENCES auth.users(id),

  -- Technical Metadata
  tech_applicability TEXT DEFAULT 'All device types',
  is_record BOOLEAN DEFAULT FALSE,
  is_predefined_core_template BOOLEAN DEFAULT FALSE,
  is_current_effective_version BOOLEAN DEFAULT FALSE,
  need_template_update BOOLEAN DEFAULT FALSE,

  -- Phase-Specific Fields (from phase_assigned_document_template)
  is_excluded BOOLEAN DEFAULT FALSE,
  classes JSONB[] DEFAULT '{}',
  phases JSONB[] DEFAULT '{}',
  markets JSONB DEFAULT '[]',
  classes_by_market JSONB DEFAULT '{}',

  -- Review & Authors
  reviewer_group_id UUID,
  reviewer_group_ids UUID[],
  reviewers JSON,
  authors_ids JSONB,
  author TEXT,

  -- Version Control
  current_version_id UUID,

  -- Platform Reference (for platform-inherited documents)
  platform_id UUID,
  platform_reference_id UUID,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_document_category CHECK (
    document_category IN ('template', 'phase_instance', 'custom', 'core')
  ),
  CONSTRAINT template_requires_company CHECK (
    document_category != 'template' OR company_id IS NOT NULL
  ),
  CONSTRAINT phase_instance_requires_template CHECK (
    document_category != 'phase_instance' OR parent_template_id IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_product ON documents(product_id);
CREATE INDEX idx_documents_phase ON documents(phase_id);
CREATE INDEX idx_documents_category ON documents(document_category);
CREATE INDEX idx_documents_scope ON documents(document_scope);
CREATE INDEX idx_documents_parent_template ON documents(parent_template_id);
CREATE INDEX idx_documents_company_scope ON documents(company_id, document_scope);
CREATE INDEX idx_documents_product_category ON documents(product_id, document_category);
```

### 2.2 Document Categories Explained

| Category | Description | document_scope | phase_id | parent_template_id |
|----------|-------------|----------------|----------|-------------------|
| `template` | Company-level phase templates | `company_template` | Required | NULL |
| `phase_instance` | Product documents from templates | `product_document` | Required | Required |
| `custom` | Product-specific custom documents | `product_document` | Optional | NULL |
| `core` | Core/standard documents | `company_document` | Optional | NULL |

### 2.3 New Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEW UNIFIED FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      documents table                             │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  TEMPLATES (document_category = 'template')                      │    │
│  │  ├── document_scope = 'company_template'                         │    │
│  │  ├── phase_id = required                                         │    │
│  │  ├── company_id = required                                       │    │
│  │  └── parent_template_id = NULL                                   │    │
│  │         │                                                        │    │
│  │         │ (instantiation - same table, linked by parent_id)      │    │
│  │         ▼                                                        │    │
│  │  PHASE INSTANCES (document_category = 'phase_instance')          │    │
│  │  ├── document_scope = 'product_document'                         │    │
│  │  ├── phase_id = required                                         │    │
│  │  ├── product_id = required                                       │    │
│  │  └── parent_template_id = template.id                            │    │
│  │                                                                  │    │
│  │  CUSTOM DOCUMENTS (document_category = 'custom')                 │    │
│  │  ├── document_scope = 'product_document'                         │    │
│  │  ├── phase_id = optional                                         │    │
│  │  ├── product_id = required                                       │    │
│  │  └── parent_template_id = NULL                                   │    │
│  │                                                                  │    │
│  │  CORE DOCUMENTS (document_category = 'core')                     │    │
│  │  ├── document_scope = 'company_document'                         │    │
│  │  ├── phase_id = optional                                         │    │
│  │  └── parent_template_id = NULL                                   │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  BENEFITS:                                                               │
│  ✓ Single source of truth                                               │
│  ✓ Clear relationships via parent_template_id                           │
│  ✓ Simple queries with document_category filter                         │
│  ✓ Consistent field names                                               │
│  ✓ Easy to track template → instance relationships                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Migration Strategy

### 3.1 Phase 1: Database Preparation

#### Step 1.1: Add new columns to documents table

```sql
-- Add document_category column
ALTER TABLE documents
ADD COLUMN document_category TEXT DEFAULT 'custom';

-- Add parent_template_id column (self-referencing)
ALTER TABLE documents
ADD COLUMN parent_template_id UUID REFERENCES documents(id);

-- Add phase-specific columns from phase_assigned_document_template
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS classes JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phases JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS markets JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS classes_by_market JSONB DEFAULT '{}';
```

#### Step 1.2: Create migration function

```sql
-- Function to migrate phase_assigned_document_template to documents
CREATE OR REPLACE FUNCTION migrate_phase_templates_to_documents()
RETURNS void AS $$
DECLARE
  template_record RECORD;
  new_doc_id UUID;
BEGIN
  FOR template_record IN
    SELECT * FROM phase_assigned_document_template
  LOOP
    -- Check if already migrated (by checking name + phase_id + company_id combo)
    IF NOT EXISTS (
      SELECT 1 FROM documents
      WHERE name = template_record.name
        AND phase_id = template_record.phase_id
        AND company_id = template_record.company_id
        AND document_category = 'template'
    ) THEN
      INSERT INTO documents (
        id,
        name,
        company_id,
        product_id,
        phase_id,
        document_scope,
        document_category,
        status,
        due_date,
        deadline,
        start_date,
        approval_date,
        description,
        brief_summary,
        document_type,
        sub_section,
        document_reference,
        version,
        date,
        file_path,
        file_name,
        file_size,
        file_type,
        public_url,
        uploaded_at,
        uploaded_by,
        tech_applicability,
        is_record,
        is_predefined_core_template,
        is_current_effective_version,
        need_template_update,
        is_excluded,
        classes,
        phases,
        markets,
        classes_by_market,
        reviewer_group_id,
        reviewer_group_ids,
        reviewers,
        authors_ids,
        author,
        current_version_id,
        created_at,
        updated_at
      ) VALUES (
        template_record.id, -- Keep same ID for FK references
        template_record.name,
        template_record.company_id,
        template_record.product_id,
        template_record.phase_id,
        template_record.document_scope,
        CASE
          WHEN template_record.document_scope = 'company_template' THEN 'template'
          WHEN template_record.product_id IS NOT NULL THEN 'phase_instance'
          ELSE 'template'
        END,
        template_record.status,
        template_record.due_date,
        template_record.deadline,
        template_record.start_date,
        template_record.approval_date,
        template_record.description,
        template_record.brief_summary,
        template_record.document_type,
        template_record.sub_section,
        template_record.document_reference,
        template_record.version,
        template_record.date,
        template_record.file_path,
        template_record.file_name,
        template_record.file_size,
        template_record.file_type,
        template_record.public_url,
        template_record.uploaded_at,
        template_record.uploaded_by,
        template_record.tech_applicability,
        template_record.is_record,
        template_record.is_predefined_core_template,
        template_record.is_current_effective_version,
        template_record.need_template_update,
        template_record.is_excluded,
        template_record.classes,
        template_record.phases,
        template_record.markets,
        template_record.classes_by_market,
        template_record.reviewer_group_id,
        template_record.reviewer_group_ids,
        template_record.reviewers,
        template_record.authors_ids,
        template_record.author,
        template_record.current_version_id,
        template_record.created_at,
        template_record.updated_at
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Step 1.3: Update existing documents with categories

```sql
-- Categorize existing documents
UPDATE documents SET document_category =
  CASE
    WHEN document_scope = 'company_template' THEN 'template'
    WHEN template_source_id IS NOT NULL AND phase_id IS NOT NULL THEN 'phase_instance'
    WHEN document_scope = 'company_document' THEN 'core'
    ELSE 'custom'
  END
WHERE document_category IS NULL OR document_category = 'custom';

-- Link phase instances to their templates
UPDATE documents d
SET parent_template_id = d.template_source_id
WHERE d.template_source_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM documents t
    WHERE t.id = d.template_source_id
  );
```

### 3.2 Phase 2: Update TypeScript Types

#### File: `src/integrations/supabase/types.ts`

```typescript
// Update Documents type
export interface Document {
  id: string;
  name: string;
  company_id: string;
  product_id: string | null;
  phase_id: string | null;

  // Classification
  document_scope: 'company_template' | 'company_document' | 'product_document';
  document_category: 'template' | 'phase_instance' | 'custom' | 'core';

  // Template relationship
  parent_template_id: string | null;

  // Status
  status: string | null;
  due_date: string | null;
  deadline: string | null;
  start_date: string | null;
  approval_date: string | null;

  // Content
  description: string | null;
  brief_summary: string | null;
  document_type: string | null;
  sub_section: string | null;
  document_reference: string | null;
  version: string | null;
  date: string | null;

  // File
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  public_url: string | null;
  uploaded_at: string | null;
  uploaded_by: string | null;

  // Technical
  tech_applicability: string | null;
  is_record: boolean | null;
  is_predefined_core_template: boolean | null;
  is_current_effective_version: boolean | null;
  need_template_update: boolean | null;

  // Phase-specific
  is_excluded: boolean | null;
  classes: any[] | null;
  phases: any[] | null;
  markets: any | null;
  classes_by_market: any | null;

  // Review
  reviewer_group_id: string | null;
  reviewer_group_ids: string[] | null;
  reviewers: any | null;
  authors_ids: any | null;
  author: string | null;

  // Version control
  current_version_id: string | null;

  // Platform
  platform_id: string | null;
  platform_reference_id: string | null;

  // Audit
  created_at: string | null;
  updated_at: string | null;
  inserted_at: string | null;
}

// Add document_category to enums
export type DocumentCategory = 'template' | 'phase_instance' | 'custom' | 'core';
```

---

## 4. Files to Modify

### 4.1 High Priority - Core Logic (15 files)

| File | Changes Required | Complexity |
|------|------------------|------------|
| `src/hooks/usePhaseDocuments.ts` | Remove dual-table logic, query single table with category filter | HIGH |
| `src/hooks/useProductDocuments.tsx` | Update queries to use document_category | HIGH |
| `src/hooks/useCompanyDocuments.ts` | Update queries for core documents | MEDIUM |
| `src/services/documentCreationService.ts` | Set document_category on creation | HIGH |
| `src/services/unifiedDocumentService.ts` | Remove table routing logic | HIGH |
| `src/services/productDocumentInstantiationService.ts` | Use parent_template_id instead of template_source_id | HIGH |
| `src/services/templateInstanceDocumentService.ts` | Update template linking logic | HIGH |
| `src/services/phaseAssignedDocumentTemplateService.ts` | DEPRECATE - merge into document service | HIGH |
| `src/api/unifiedDocumentsApi.ts` | Update all queries | MEDIUM |
| `src/components/product/documents/DocumentTabs.tsx` | Update count calculations | MEDIUM |
| `src/components/product/documents/AllActivePhasesTab.tsx` | Update document queries | MEDIUM |
| `src/components/product/documents/ProductSpecificDocumentsTab.tsx` | Update filtering logic | MEDIUM |
| `src/components/settings/document-control/AdvancedDocumentManager.tsx` | Update CRUD operations | HIGH |
| `src/services/documentTemplateService.ts` | Update template operations | MEDIUM |
| `src/integrations/supabase/types.ts` | Update types | MEDIUM |

### 4.2 Medium Priority - Services (20 files)

| File | Changes Required |
|------|------------------|
| `src/services/companyInitializationService.ts` | Update template creation |
| `src/services/documentServiceRouter.ts` | Simplify routing |
| `src/services/documentTemplateFileService.ts` | Update file operations |
| `src/services/ganttPhaseDocumentService.ts` | Update Gantt queries |
| `src/services/ganttSubTaskSyncService.ts` | Update sync logic |
| `src/services/phaseDocumentCountService.ts` | Update count queries |
| `src/services/phaseDocumentVersionService.ts` | Update version queries |
| `src/services/platformProductCreationService.ts` | Update platform docs |
| `src/services/productCreationService.ts` | Update product creation |
| `src/services/projectCreationService.tsx` | Update project creation |
| `src/services/reviewerProductService.ts` | Update reviewer queries |
| `src/services/productSpecificDocumentService.ts` | Update queries |
| `src/services/documentPhaseFixService.ts` | Update phase fixes |
| `src/services/documentPhaseValidationService.ts` | Update validation |
| `src/services/documentReviewerService.ts` | Update reviewer logic |
| `src/services/phaseCompletionService.ts` | Update completion checks |
| `src/services/phaseMetricsService.ts` | Update metrics |
| `src/services/phaseTemplateService.ts` | Update template queries |
| `src/services/productDocumentDueDateService.ts` | Update due date logic |
| `src/services/productDocumentService.ts` | Update document service |

### 4.3 Low Priority - Components (25 files)

| File | Changes Required |
|------|------------------|
| `src/components/gantt-chart/GanttChart.tsx` | Update document queries |
| `src/components/product/DocumentViewer.tsx` | Update viewer queries |
| `src/components/product/timeline/PhaseDocumentDialog.tsx` | Update dialog |
| `src/components/review/AwaitingMyReviewPage.tsx` | Update review queries |
| `src/components/review/DocumentReviewKanban.tsx` | Update kanban |
| `src/components/settings/document-control/DocumentDeleteDialog.tsx` | Update delete |
| `src/components/settings/document-control/DocumentEditDialog.tsx` | Update edit |
| `src/components/settings/document-control/utils/documentOperations.ts` | Update operations |
| ... and 17 more component files | Various updates |

### 4.4 Hooks to Update (12 files)

| Hook | Current Tables Used | New Query Pattern |
|------|---------------------|-------------------|
| `usePhaseDocuments` | Both | Single table, category filter |
| `useProductDocuments` | Both | Single table, category filter |
| `useCompanyDocuments` | documents | Add category filter |
| `useCIAnalytics` | phase_assigned_document_template | Change to documents |
| `useDocumentAssignmentPhases` | Both | Single table |
| `useOptimizedProductDocuments` | Both | Single table |
| `usePendingReviewsCount` | Both | Single table |
| `usePhaseCIData` | phase_assigned_document_template | Change to documents |
| `useReviewWorkflows` | Both | Single table |
| `usePhaseOperations` | documents | Add category awareness |
| `usePhaseProgress` | documents | Add category filter |
| `useProductDocumentInstances` | documents | Update instantiation |

---

## 5. Code Changes Examples

### 5.1 usePhaseDocuments.ts - Before & After

#### BEFORE (Complex dual-table logic):
```typescript
// Current: Queries both tables
const { data: phaseDocsData } = await supabase
  .from("phase_assigned_document_template")
  .select("*")
  .eq("company_id", companyId)
  .in("phase_id", activePhaseIds);

// Then also queries documents table
const { data: noPhaseDocs } = await supabase
  .from("documents")
  .select("*")
  .eq("product_id", productId)
  .is("phase_id", null);

// Complex merging logic...
```

#### AFTER (Simple single-table query):
```typescript
// New: Single table with category filter
const { data: phaseDocuments } = await supabase
  .from("documents")
  .select("*")
  .eq("company_id", companyId)
  .in("phase_id", activePhaseIds)
  .in("document_category", ["template", "phase_instance"]);

// For product-specific phase documents
const { data: productPhaseDocuments } = await supabase
  .from("documents")
  .select("*")
  .eq("product_id", productId)
  .eq("document_category", "phase_instance");
```

### 5.2 Document Creation - Before & After

#### BEFORE:
```typescript
// Template creation goes to phase_assigned_document_template
await supabase.from("phase_assigned_document_template").insert({
  name,
  phase_id,
  company_id,
  document_scope: "company_template",
  // ...
});

// Instance creation goes to documents
await supabase.from("documents").insert({
  name,
  phase_id,
  product_id,
  template_source_id: templateId,
  document_scope: "product_document",
  // ...
});
```

#### AFTER:
```typescript
// Template creation - same table
await supabase.from("documents").insert({
  name,
  phase_id,
  company_id,
  document_scope: "company_template",
  document_category: "template",
  parent_template_id: null,
  // ...
});

// Instance creation - same table, linked to template
await supabase.from("documents").insert({
  name,
  phase_id,
  product_id,
  company_id,
  document_scope: "product_document",
  document_category: "phase_instance",
  parent_template_id: templateId, // Self-referencing FK
  // ...
});
```

### 5.3 DocumentTabs.tsx - Count Calculation

#### BEFORE:
```typescript
// Confusing: Shows phase count, not document count
const viewCounts = {
  allPhases: productPhaseCount || activePhaseCount,
  productSpecific: productSpecificCount
};
```

#### AFTER:
```typescript
// Clear: Actual document counts by category
const { data: counts } = await supabase
  .from("documents")
  .select("document_category")
  .eq("product_id", productId);

const viewCounts = {
  phaseDocuments: counts.filter(d => d.document_category === "phase_instance").length,
  customDocuments: counts.filter(d => d.document_category === "custom").length,
  coreDocuments: counts.filter(d => d.document_category === "core").length
};
```

---

## 6. RLS Policy Updates

### 6.1 Current Policies to Migrate

```sql
-- Drop old policies on phase_assigned_document_template
DROP POLICY IF EXISTS "Users can view phase assigned documents"
  ON phase_assigned_document_template;
DROP POLICY IF EXISTS "Users can manage phase assigned documents"
  ON phase_assigned_document_template;

-- Create comprehensive policy on documents table
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert_policy" ON documents
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "documents_update_policy" ON documents
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "documents_delete_policy" ON documents
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
    )
  );
```

---

## 7. Implementation Timeline

### Week 1: Database & Types
- [ ] Create migration SQL scripts
- [ ] Add new columns to documents table
- [ ] Run data migration from phase_assigned_document_template
- [ ] Update TypeScript types
- [ ] Test migration in staging

### Week 2: Core Hooks & Services
- [ ] Update usePhaseDocuments.ts
- [ ] Update useProductDocuments.tsx
- [ ] Update useCompanyDocuments.ts
- [ ] Update documentCreationService.ts
- [ ] Update unifiedDocumentService.ts
- [ ] Update productDocumentInstantiationService.ts

### Week 3: Secondary Services
- [ ] Update all 20 medium-priority services
- [ ] Deprecate phaseAssignedDocumentTemplateService.ts
- [ ] Update API endpoints

### Week 4: Components & Testing
- [ ] Update DocumentTabs.tsx
- [ ] Update AllActivePhasesTab.tsx
- [ ] Update ProductSpecificDocumentsTab.tsx
- [ ] Update AdvancedDocumentManager.tsx
- [ ] Update remaining 25 component files
- [ ] Comprehensive testing

### Week 5: Cleanup & Deployment
- [ ] Remove all references to phase_assigned_document_template
- [ ] Drop deprecated table (after backup)
- [ ] Update RLS policies
- [ ] Performance testing
- [ ] Production deployment

---

## 8. Rollback Plan

### 8.1 Backup Strategy
```sql
-- Before migration, create backup
CREATE TABLE phase_assigned_document_template_backup AS
SELECT * FROM phase_assigned_document_template;

-- Keep template_source_id column for rollback
-- Don't drop it until migration is confirmed successful
```

### 8.2 Rollback Steps
1. Restore phase_assigned_document_template from backup
2. Revert code changes via git
3. Remove new columns from documents table
4. Restore old RLS policies

---

## 9. Testing Checklist

### 9.1 Data Integrity Tests
- [ ] All phase_assigned_document_template records migrated
- [ ] Document counts match before/after migration
- [ ] Template → Instance relationships preserved
- [ ] No orphaned records

### 9.2 Functional Tests
- [ ] Create new template document
- [ ] Instantiate template for product
- [ ] Update document status
- [ ] Delete document
- [ ] Phase document filtering
- [ ] Custom document creation
- [ ] Document search/filter
- [ ] Review workflow

### 9.3 Performance Tests
- [ ] Query performance with indexes
- [ ] Large dataset handling (1000+ documents)
- [ ] Concurrent operations

---

## 10. Success Metrics

| Metric | Before | After Target |
|--------|--------|--------------|
| Tables for documents | 2 | 1 |
| Files with dual-table queries | ~15 | 0 |
| Query complexity (avg joins) | 2-3 | 0-1 |
| Code lines in document hooks | ~800 | ~400 |
| Data consistency issues | Frequent | None |

---

## Appendix A: Complete File List (105 files)

### Services (32 files)
<details>
<summary>Click to expand</summary>

1. `src/services/automaticInstanceService.ts`
2. `src/services/ciActivityService.ts`
3. `src/services/ciAnalyticsService.ts`
4. `src/services/clientService.ts`
5. `src/services/companyInitializationService.ts`
6. `src/services/companySyncService.ts`
7. `src/services/dataRoomContentGenerator.ts`
8. `src/services/documentCleanupService.ts`
9. `src/services/documentCreationService.ts`
10. `src/services/documentFileGenerationService.ts`
11. `src/services/documentOrganizationService.ts`
12. `src/services/documentPhaseFixService.ts`
13. `src/services/documentPhaseValidationService.ts`
14. `src/services/documentReviewerService.ts`
15. `src/services/documentServiceRouter.ts`
16. `src/services/documentTemplateFileService.ts`
17. `src/services/documentTemplateService.ts`
18. `src/services/enhancedDocumentCleanupService.ts`
19. `src/services/eudamedDuplicateCleanupService.ts`
20. `src/services/ganttPhaseDocumentService.ts`
21. `src/services/ganttSubTaskSyncService.ts`
22. `src/services/phaseAssignedDocumentTemplateService.ts`
23. `src/services/phaseCompletionService.ts`
24. `src/services/phaseDocumentCountService.ts`
25. `src/services/phaseDocumentVersionService.ts`
26. `src/services/phaseMetricsService.ts`
27. `src/services/phaseTemplateService.ts`
28. `src/services/platformProductCreationService.ts`
29. `src/services/productCreationService.ts`
30. `src/services/productDocumentDueDateService.ts`
31. `src/services/productDocumentInstantiationService.ts`
32. `src/services/productDocumentService.ts`
33. `src/services/productSpecificDocumentService.ts`
34. `src/services/projectCreationService.tsx`
35. `src/services/reviewerProductService.ts`
36. `src/services/sopDocumentContentService.ts`
37. `src/services/superAdminTemplateManagementService.ts`
38. `src/services/templateInstantiationService.ts`
39. `src/services/templateInstanceDocumentService.ts`
40. `src/services/templateManagementService.ts`
41. `src/services/unifiedDocumentService.ts`
42. `src/services/unifiedDocumentUpdateService.ts`

</details>

### Hooks (18 files)
<details>
<summary>Click to expand</summary>

1. `src/hooks/useActivityTemplates.ts`
2. `src/hooks/useCIAnalytics.ts`
3. `src/hooks/useCommunications.ts`
4. `src/hooks/useCompanyDocumentInheritance.ts`
5. `src/hooks/useCompanyDocuments.ts`
6. `src/hooks/useDocumentAssignmentPhases.ts`
7. `src/hooks/useDocumentReviewers.ts`
8. `src/hooks/useEfficientClients.ts`
9. `src/hooks/useMissionControlData.ts`
10. `src/hooks/useOptimizedProductDocuments.tsx`
11. `src/hooks/usePendingReviewsCount.ts`
12. `src/hooks/usePermission.ts`
13. `src/hooks/usePhaseCIData.ts`
14. `src/hooks/usePhaseDocuments.ts`
15. `src/hooks/usePhaseOperations.tsx`
16. `src/hooks/usePhaseProgress.ts`
17. `src/hooks/usePlatformDocumentInheritance.ts`
18. `src/hooks/useProductDocumentInstances.ts`
19. `src/hooks/useProductDocuments.tsx`
20. `src/hooks/useReviewWorkflows.ts`

</details>

### Components (35 files)
<details>
<summary>Click to expand</summary>

1. `src/components/company/CompanyMilestones.tsx`
2. `src/components/debug/FileUploadDebugger.tsx`
3. `src/components/debug/PhaseDocumentCountTest.tsx`
4. `src/components/document-composer/DocFileUpload.tsx`
5. `src/components/documents/UnifiedDocumentManager.tsx`
6. `src/components/gantt-chart/GanttChart.tsx`
7. `src/components/product/creation/PlatformSelector.tsx`
8. `src/components/product/DocumentComments.tsx`
9. `src/components/product/documents/AllActivePhasesTab.tsx`
10. `src/components/product/documents/AvailableDocumentsSection.tsx`
11. `src/components/product/documents/DocumentTabs.tsx`
12. `src/components/product/documents/ProductPhaseDocuments.tsx`
13. `src/components/product/documents/ProductSpecificDocumentsTab.tsx`
14. `src/components/product/DocumentViewer.tsx`
15. `src/components/product/gap-analysis/GapAnalysisDocuments.tsx`
16. `src/components/product/gap-analysis/GapAnalysisDocumentUpload.tsx`
17. `src/components/product/ProductDocuments.tsx`
18. `src/components/product/timeline/PhaseDocumentDialog.tsx`
19. `src/components/review/AddDocumentReviewDialog.tsx`
20. `src/components/review/AwaitingMyReviewPage.tsx`
21. `src/components/review/DocumentReviewKanban.tsx`
22. `src/components/review/ReviewerAnalyticsDashboard.tsx`
23. `src/components/settings/document-control/AdvancedDocumentManager.tsx`
24. `src/components/settings/document-control/DocumentDeleteDialog.tsx`
25. `src/components/settings/document-control/DocumentEditDialog.tsx`
26. `src/components/settings/document-control/hooks/useDeleteDocument.ts`
27. `src/components/settings/document-control/utils/documentOperations.ts`
28. `src/components/settings/document-control/utils/enhancedDocumentOperations.ts`
29. `src/components/settings/DocumentCard.tsx`
30. `src/components/super-admin/TemplateViewerDialog.tsx`

</details>

### APIs & Types (3 files)
<details>
<summary>Click to expand</summary>

1. `src/api/unifiedDocumentsApi.ts`
2. `src/api/phaseDocumentsApi.ts`
3. `src/integrations/supabase/types.ts`

</details>

---

## Appendix B: Query Pattern Changes

### Templates Query
```typescript
// OLD
const { data } = await supabase
  .from("phase_assigned_document_template")
  .select("*")
  .eq("document_scope", "company_template");

// NEW
const { data } = await supabase
  .from("documents")
  .select("*")
  .eq("document_category", "template");
```

### Phase Instances Query
```typescript
// OLD
const { data } = await supabase
  .from("documents")
  .select("*")
  .eq("document_scope", "product_document")
  .not("template_source_id", "is", null);

// NEW
const { data } = await supabase
  .from("documents")
  .select("*")
  .eq("document_category", "phase_instance");
```

### Custom Documents Query
```typescript
// OLD
const { data } = await supabase
  .from("documents")
  .select("*")
  .eq("document_scope", "product_document")
  .is("template_source_id", null);

// NEW
const { data } = await supabase
  .from("documents")
  .select("*")
  .eq("document_category", "custom");
```
