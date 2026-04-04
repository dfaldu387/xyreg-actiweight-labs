# IP Management Module Implementation Plan

## Phase 1: Core Database & Foundation ✅ COMPLETE

### Database Tables Created:
- [x] `ip_assets` - Core IP asset record with company_id, ip_type, title, status, inventors, etc.
- [x] `ip_asset_products` - Junction table linking IP to products  
- [x] `ip_filings` - Per-country filing details with EPO/USPTO data caching
- [x] `ip_deadlines` - Deadline tracking with reminder days
- [x] `ip_costs` - Financial tracking for IP expenses
- [x] `invention_disclosures` - Invention submission workflow

### Enums Created:
- `ip_asset_type`: patent, trademark, copyright, trade_secret, design_right
- `ip_asset_status`: idea, disclosure, filing_prep, pending, granted, abandoned, expired
- `deadline_status`: upcoming, completed, missed, cancelled
- `disclosure_status`: submitted, under_review, approved_for_filing, rejected, converted_to_asset

### Security:
- [x] RLS enabled on all tables
- [x] Policies based on `user_company_access` table
- [x] Proper indexes for performance

---

## Phase 2: Frontend Components ✅ COMPLETE

### Sidebar Navigation
- [x] Added IP Management group in company sidebar

### Components Created:
- [x] `src/components/ip-management/IPDashboard.tsx` - Dashboard with stats and overview
- [x] `src/components/ip-management/IPAssetsList.tsx` - List view with filters
- [x] `src/components/ip-management/IPAssetForm.tsx` - Create/edit dialog
- [x] `src/components/ip-management/IPDeadlineTracker.tsx` - Deadline management
- [x] `src/components/layout/sidebar/IPManagementGroup.tsx` - Sidebar navigation

### Pages Created:
- [x] `src/pages/CompanyIPPortfolioPage.tsx` - Main page with tabs

### Hooks Created:
- [x] `src/hooks/useIPAssets.ts` - CRUD operations
- [x] `src/hooks/useIPDeadlines.ts` - Deadline queries
- [x] `src/hooks/useIPFilings.ts` - Filing management
- [x] `src/hooks/useIPStrategy.ts` - Product-level IP Strategy data

### Routes Added:
- [x] `/app/company/:companyName/ip-portfolio` - Company IP Portfolio page
- [x] `/app/product/:productId/business-case?tab=ip-strategy` - Product IP Strategy (Genesis Step 8c)

### Genesis Integration:
- [x] Step 8c "IP Strategy & Freedom to Operate" now routes to Business Case IP Strategy tab
- [x] Completion tracked via `ip_strategy_completed`, `ip_protection_types`, `ip_ownership_status`, `fto_risk_level` fields
- [x] SaMD open-source license audit for software projects
- [x] IP ownership alert for non-company-owned IP

---

## Phase 3: EPO API Integration (TODO)

### Edge Function:
- `supabase/functions/epo-patent-lookup/index.ts`

### Features:
- Data enrichment from application number
- Family linking
- Status monitoring
- Legal event tracking

---

## Phase 4: USPTO API Integration (TODO)

### Edge Function:
- `supabase/functions/uspto-patent-lookup/index.ts`

---

## Phase 5: Advanced Features (TODO)

- Invention Disclosure Workflow
- Strategic IP Analysis
- Portfolio Mapping
- Competitor Tracking
- Integration with Venture Blueprint, Risk, Budget, rNPV

---

## Phase 6: Notifications & Automation (TODO)

- Email alerts for deadlines
- In-app notifications
- Background sync jobs
