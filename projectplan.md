# Project Plan — CCR Create Not Working

## Goal
Restore the **Create CCR** action so a new change request can be submitted successfully from the Change Control dialog.

## Likely Root Cause
- The CCR insert currently sends `created_by` from `auth.users.id`, but the `change_control_requests.created_by` column references `profiles.id`.
- That mismatch can cause the insert to fail even when the dialog fields are filled correctly.

## Todo
- [x] Confirm the create mutation uses the correct profile-based user ID for `created_by`
- [x] Apply the smallest possible fix in the CCR create flow only
- [ ] Verify the dialog closes and the new CCR appears after successful creation
- [x] Add a short review summary here after implementation

## Review (after implementation)
- Root cause confirmed from the failing network request: `change_control_requests.created_by` references `profiles.id`, while the create flow was sending the signed-in `auth.users.id` without guaranteeing a matching `profiles` row existed.
- Implemented the smallest fix in `src/hooks/useChangeControlData.ts` only:
  - added a helper that fetches the current user,
  - checks for a matching row in `profiles`,
  - creates that row via `upsert` when missing,
  - then uses that resolved `profiles.id` for CCR creation.
- No UI behavior was changed; this is limited to the CCR create save path.

---

# Project Plan — Genesis Step 5 (Device Type) fixes

## Goal
Make Genesis **Step 5: Device Type** consistent and correct:
- Link lands on **General Information → Type** (same URL subtab `classification`, label renamed)
- Step completion requires **3 items**:
  1) Primary Regulatory Type
  2) Core Device Nature
  3) Active device (yes/no selected)
- The right sidebar **“To Complete This Step”** shows these 3 items (not Step 4 items)

## Todo
- [x] Update Step 5 “To Complete This Step” requirements to the 3 items above
- [x] Update the progress hook to expose the 3 Device Type sub-checks for individual ticks
- [x] Rename the General sub-tab label **“Classification” → “Type”** (label only)
- [x] Sanity check: Step 5 turns green only when all 3 are complete
- [x] Fix: Parse `products.device_type` (TEXT JSON) so “Core Device Nature” completion ticks correctly
- [x] Fix: Don’t preselect “Active device” when DB value is unset

## Review (after implementation)
- Changes made:
  - Fixed Step 5 completion by parsing `products.device_type` as JSON text in `useViabilityFunnelProgress`.
  - Removed the default `false` for Active Device so new devices start with no selection.
- Files touched:
  - `src/hooks/useViabilityFunnelProgress.ts`
  - `src/components/product/device/DeviceInformationContainer.tsx`
  - `src/components/product/device/ComprehensiveDeviceInformation.tsx`
- Verification:
  - Sidebar “Select Core Device Nature” now ticks when invasiveness is selected for MDR, and is hidden only for IVD.


---

# Project Plan: rNPV Risk Model Architecture Refactor
 
## Recent Addition: Value Evolution Analytics Tab

### Status: ✅ COMPLETE

Created the "Value Evolution" analytics tab for tracking project asset value over the complete lifecycle:

**Files Created:**
- `src/types/valueEvolution.ts` - Type definitions for the value evolution system
- `src/utils/valueEvolutionCalculators.ts` - Core calculation engine with formulas:
  - `calculateAssetValue()`: `Current_Value = (FutureCashFlows / (1+r)^t) * Product_of_Remaining_Phase_LoS`
  - `calculateValueJumpOnCompletion()`: Value step-up when phase LoS retires to 1.0
  - `generateStepUpCurve()`: Complete timeline generation
  - `calculatePostLaunchDecline()`: Linear decline from peak to IP expiry
- `src/components/value-evolution/`:
  - `index.ts` - Barrel exports
  - `ValueEvolutionTab.tsx` - Main container with state management
  - `StepUpValueChart.tsx` - Recharts ComposedChart with stepped S-curve, sunk cost overlay
  - `ValueEvolutionControls.tsx` - Phase LoS sliders, launch date picker, IP expiry control
  - `CurrentValueSummary.tsx` - Key metrics display (Current Value, Peak, Net Created)
  - `PhaseInflectionMarkers.tsx` - Phase milestone markers with status indicators

**Features Implemented:**
- ✅ Stepped S-curve pre-launch (value jumps at phase completions)
- ✅ Linear decline post-launch toward IP expiry
- ✅ Sunk Cost Overlay (gray area) showing cumulative spend
- ✅ Interactive Phase LoS sliders for what-if analysis
- ✅ Launch Date and IP Expiry date pickers
- ✅ Real-time recalculation on input changes
- ✅ Today marker, Launch marker, IP Expiry marker on chart
- ✅ Phase milestone markers (complete/in-progress/future states)
- ✅ Summary metrics: Current Value, Peak Value, Cumulative LoS, Net Value Created

**Chart Architecture:**
- X-Axis: Complete lifecycle timeline (project start → IP expiry)
- Y-Axis: Project Asset Value ($)
- Pre-Launch: Stepped S-curve with vertical jumps at phase completions
- Post-Launch: Linear decline from peak to zero at IP expiry

**Integration:**
- Added as 5th tab in `RNPVAnalysis.tsx` (Analysis, Cost Distribution, **Value Evolution**, Financials, Timeline)

---

## Previous: Interactive Cost Distribution Component (Complete)

## Objective
Implement a phase-aware risk calculation model that differentiates between development probability (Phase LoS) and operational market risks post-launch.

## Architecture Specification

### Risk Calculation Logic

| Stage | Formula | Logic |
|-------|---------|-------|
| Pre-Launch | `Cost × PhaseLoS` | Development costs weighted by probability of reaching each milestone |
| Post-Launch | `Revenue × 1.0 × (Reg × Comm × Comp)` | Revenue driven only by current market/compliance risks |

### Key Decisions
1. **Technical Risk Field**: Keep in UI but lock at 0% (disabled) post-launch with "Validated" badge
2. **Phase LoS**: Does NOT multiply post-launch risks (development risk is "retired")
3. **Option A selected**: Fresh slate logic for operational portfolio management

## Todo

- [x] Update chart container from `AreaChart` → `ComposedChart` so the rNPV `<Line>` renders.
- [x] Update calculation engine to detect launch phase transition
- [x] Lock Technical LoS at 1.0 post-launch in calculation
- [x] Apply only (Reg × Comm × Comp) to post-launch revenue
- [x] Gray out Technical Risk field in UI post-launch
- [x] Add "Validated" badge to Technical Risk post-launch

## Files Updated
- `src/components/investor-view/ProductLifecycleCashFlowChart.tsx` - calculation logic
  - Added extraction of market risks (regulatory, commercial, competitive) from npvData
  - Added `postLaunchSuccessMultiplier` calculation: `(100-Reg%) × (100-Comm%) × (100-Comp%)`
  - Pre-launch: costs weighted by Phase LoS
  - Post-launch: revenue weighted by market risks only (not PhaseLoS)
  
- `src/components/product/business/MarketAnalysisForm.tsx` - UI state for Technical Risk field
  - Added `isPostLaunch` prop
  - Technical Risk field: disabled, value=0, gray styling, "Validated" badge when post-launch
  - Help text explaining why Technical Risk is retired

## Review

### Changes Made
1. **Chart Calculation**: Post-launch revenue now multiplied by `(Reg × Comm × Comp)` success rates instead of Phase LoS
2. **UI Enhancement**: Technical Risk field shows "Validated" badge and is disabled/grayed out post-launch
3. **Audit Trail Preserved**: Field remains visible (not removed) for DHF/audit purposes

### Architecture Notes
- Pre-launch: Development probability (Phase LoS) applies to expected costs
- Post-launch: Market risks (Regulatory, Commercial, Competitive) apply to revenue
- Technical/Development risk is "retired" after launch - the device has been validated
- This enables real-time asset valuation based on current market conditions

---

# Project Plan: Design Review & Baseline Module

## Status: ✅ COMPLETE

### Database (5 tables with RLS + auto-ID triggers)
`design_reviews`, `design_review_manifest_items`, `design_review_findings`, `design_review_signatures`, `design_review_participants`

### Files Created
- `src/types/designReview.ts`, `src/hooks/useDesignReviews.ts`, `src/services/designReviewService.ts`
- `src/pages/ProductDesignReviewPage.tsx`, `src/pages/DesignReviewDetailPage.tsx`, `src/pages/CompanyDesignReviewPage.tsx`
- `src/components/design-review/DesignReviewCreateDialog.tsx`

### Files Modified
- `src/App.tsx` (3 routes), `src/components/layout/sidebar/SidebarContextualMenu.tsx` (sidebar entries)

---

# Project Plan: Extend Traceability Chain — BOM → Component → Feature → User Need

## Status: ✅ COMPLETE

### Database
- Created `feature_user_needs` junction table (many-to-many: feature_name ↔ user_need_id per product)
- RLS policies using `user_company_access` pattern

### Files Modified
- `src/services/enhancedTraceabilityService.ts` — Added 3 new `getItemsByType` cases (bom_item, device_component, feature) + `addPhysicalThreadLinks()` method for resolving BOM→Component, Component→Feature, Feature→UserNeed, Component→Requirement virtual links
- `src/components/product/design-risk-controls/traceability/visualizer/useTraceabilityGraph.ts` — Extended `COLUMN_CONFIG`, `typeOrder`, and `TYPE_RANK` with 3 new node types
- `src/components/product/design-risk-controls/traceability/visualizer/TraceabilityFlowNode.tsx` — Added node styles for bom_item (📦), device_component (🔩), feature (⭐)
- `src/components/product/design-risk-controls/traceability/TraceabilityMatrix.tsx` — Added 3 new columns to `CANONICAL_ORDER`, `itemTypeOptions`, `defaultTargets`, and `TYPE_TO_ROUTE`
- `src/components/product/design-risk-controls/traceability/visualizer/TraceabilityInspectorPanel.tsx` — Added labels and navigation routes for 3 new node types

### Result
Full digital thread: **BOM Item → Component → Feature → User Need → System Req → HW/SW Req → Hazard → Risk Control → Test Case**

---

# Project Plan — Devices nav opens Mission Control

## Goal
Clicking the Devices L1 module should always open the device area, not leave the user on Mission Control. Product pages must also stop crashing on a broken dynamic import.

## Todo
- [x] Make L1 Devices click navigate to a real device page when no last device exists
- [x] Replace dead `/app/devices` links with the canonical company portfolio URL
- [x] Fix CompanyProductsPage redirect target so it lands on a real `/app/...` route
- [x] Lazy-load the heavy GanttChartV23 inside DualPhaseGanttChart so the broken `@svar-ui/*` chain no longer breaks ProductDashboard
- [ ] Verify Devices click + product page load in preview

## Review (after implementation)
- AppLayout `handleModuleSelect("products")` now navigates to `/app/company/:companyName/portfolio?view=cards` (or `/app/clients` if no company) when no last product is stored.
- Sidebar "Back to all devices" links and the `CompanyCommercialGroup` Strategic Horizon fallback now use the canonical `/app/company/:companyName/portfolio?view=cards`.
- Mission Control's Compliance Journey strip and `CompanyProductsPage` redirect now use the same canonical route.
- `PlatformProfile` linked products now navigate to `/app/product/:id` instead of the non-existent `/app/company/:companyName/products/:id`.
- `DualPhaseGanttChart` now lazy-loads `GanttChartV23` so the local gantt source (which imports several missing `@svar-ui/*` transitive packages) is no longer pulled into the ProductDashboard bundle. The readonly branch wraps it in `Suspense` with a small loader.
