# Project Plan: Fix bun install timeout (nested overrides)

## Problem
Bun fails to install because `package.json` contains a **nested `overrides`** entry for `@wamra/gantt-task-react` (Bun warns it doesn’t support nested overrides), causing the install to hang/time out during Lovable preview builds.

## Todo List
- [ ] Remove the `@wamra/gantt-task-react` nested overrides block from `package.json` (via dependency tooling / cleanup).
- [ ] Remove any remaining `@wamra/gantt-task-react` imports/usages in the codebase (components + CSS).
- [ ] Confirm any Gantt UI uses the existing supported library (`@svar-ui/react-gantt` / `wx-react-gantt`) and styling still works.
- [ ] Verify preview builds successfully.

## Review
- (Pending after implementation)

---

# Project Plan: IVD Risk Class Dropdowns (All Markets)


## Objective
When **Primary Regulatory Type = In Vitro Diagnostic (IVD)**, every market card must show **IVD-specific risk class options** (e.g., EU/UK/CH = A–D; AU = 1–4), and every “Apply Classification” action must set a value that matches the dropdown options exactly.

## Todo List
- [ ] Add missing IVD dropdown options in `marketRiskClassMapping.ts` (notably Australia IVD 1–4)
- [ ] In `RegulatoryCardsSection.tsx`, choose the risk class dropdown options based on `primaryRegulatoryType` + `market.code` (hide MDR classes when IVD, and hide IVD classes when not IVD)
- [ ] Fix EU “IVDR Assistant” apply logic by replacing legacy `convertDeviceClassToRiskClass` mapping with canonical class code normalization (so IVDR “Class C” becomes stored as `C`)
- [ ] Quick smoke test: EU/UK/AU assistants apply and dropdown reflects selection; non-IVD mode still shows correct MDR dropdowns

## Review
- (Pending after implementation)

---

# Project Plan: Market-Specific IVD Classification Assistants


## Objective
Add dedicated IVD classification assistants for UK and FDA markets, showing appropriate assistants based on device type (IVD vs general medical device).

## Todo List
- [x] Create UK IVDR Classification Rules (`src/data/ukIVDRClassificationRules.ts`)
- [x] Create UK IVDR Classification Hook (`src/hooks/useUKIVDRClassificationAssistant.ts`)
- [x] Create UK IVDR Classification Assistant Component (`src/components/classification/UKIVDRClassificationAssistant.tsx`)
- [x] Create UK IVDR Classification Trigger (`src/components/classification/UKIVDRClassificationTrigger.tsx`)
- [x] Create FDA IVD Classification Rules (`src/data/fdaIVDClassificationRules.ts`)
- [x] Create FDA IVD Classification Hook (`src/hooks/useFDAIVDClassificationAssistant.ts`)
- [x] Create FDA IVD Classification Assistant Component (`src/components/classification/FDAIVDClassificationAssistant.tsx`)
- [x] Create FDA IVD Classification Trigger (`src/components/classification/FDAIVDClassificationTrigger.tsx`)
- [x] Update types to include new fields (`regulatoryPathway`, `requirements`, `productCodeExamples`)
- [x] Integrate into RegulatoryCardsSection with conditional logic based on primaryRegulatoryType

## Review
- **EU**: "IVDR Assistant" for IVDs (Classes A-D) - already existed
- **UK**: "UK IVDR Assistant" for IVDs (Classes A-D based on UK MDR 2002 Part IV)
- **USA**: "FDA IVD Assistant" for IVDs (Classes I/II/III based on 21 CFR 809)
- Non-IVD devices continue to use hardware assistants ("MHRA Assistant", "FDA Assistant")

### Implementation Details
- UK IVDR decision tree: Blood safety, CDx, infectious disease, cancer markers, genetic, self-testing, general lab, instruments
- FDA IVD decision tree: Blood banking, CDx, infectious disease, oncology, genetic, OTC, clinical chemistry, instruments
- Both assistants include regulatory pathway and key requirements in results
- FDA IVD includes example product codes for reference

---

# Previous Plan: SiMD Classification - Market-Specific Software Assistants

## Objective
Add dedicated software classification assistants for UK and FDA markets, matching the EU Rule 11 assistant pattern.

## Todo List
- [x] Create UK SaMD Classification Rules (`src/data/ukSaMDClassificationRules.ts`)
- [x] Create UK SaMD Classification Hook (`src/hooks/useUKSaMDClassificationAssistant.ts`)
- [x] Create UK SaMD Classification Assistant Component (`src/components/classification/UKSaMDClassificationAssistant.tsx`)
- [x] Create FDA SaMD Classification Rules (`src/data/fdaSaMDClassificationRules.ts`)
- [x] Create FDA SaMD Classification Hook (`src/hooks/useFDASaMDClassificationAssistant.ts`)
- [x] Create FDA SaMD Classification Assistant Component (`src/components/classification/FDASaMDClassificationAssistant.tsx`)
- [x] Integrate UK and FDA software assistants into ComponentRiskClassificationSection
- [x] Add state variables for new assistant dialogs
- [x] Add software assistant buttons for UK and US markets

## Review
- **EU/CH**: "Software Assistant (Rule 11)" - MDR Rule 11 decision tree
- **UK**: "Software Assistant (UK MHRA)" - Based on MHRA guidance with indirect harm consideration
- **US**: "Software Assistant (FDA SaMD)" - IMDRF N12 risk categorization framework
- **Other markets**: Manual selection with guidance note about IEC 62304 lifecycle vs classification

### Implementation Details
- UK decision tree: Based on intended purpose + potential harm impact
- FDA decision tree: Based on IMDRF framework (significance of information × healthcare situation)
- Both assistants output market-appropriate device risk classes (I/IIa/IIb/III for UK, I/II/III for FDA)

---

# Previous Plan: SiMD Classification - Market-Specific Assistants (Hardware)

## Review
- EU: Shows "EU MDR Assistant (Hardware)" + "Software Assistant (Rule 11)"
- UK: Shows "UK MHRA Assistant (Hardware)" + "Software Assistant (UK MHRA)"
- US: Shows "FDA Assistant (Hardware)" + "Software Assistant (FDA SaMD)"
- SiMD: No "Available Components from Product Definition" or "Add Custom Component" controls; shows HW class + SW class
- Other markets: Shows manual selection guidance for both HW/SW

---

# Project Plan: Step 14 Reimbursement – Market Accordion + Missing Markets

---

# Project Plan: Genesis Revenue Forecast Lifecycle Chart Enhancement

## Objective
Enhance the Genesis Revenue Forecast chart to visualize the complete product lifecycle, showing development phases (with dates and costs) leading up to market launch, followed by post-launch revenue projections.

## Changes Made
**File modified:** `src/components/product/business-case/GenesisRNPVEssentials.tsx`

### Step 1: Added Phase Breakdown State ✓
- Added `phaseBreakdown: PhaseBudgetData[]` state to store budget phase details
- Updated `fetchDevCostsFromBudget` to save `budgetSummary.phaseBreakdown`
- Added `useEffect` to load phase breakdown on mount for timeline visualization

### Step 2: Created Combined Chart Data ✓
- Added `CombinedChartDataPoint` interface with `label`, `phase`, `cost`, `revenue`, `cumulative`, `type`, and `isLaunch` fields
- Created `combinedChartData` useMemo that:
  - Sorts development phases by start date
  - Calculates cumulative costs for development phases (negative cash flow)
  - Adds a market launch marker at the projected launch date
  - Appends post-launch revenue years with calculated growth
  - Uses `format(date, 'MMM yyyy')` for development phases and `yyyy` for revenue years

### Step 3: Enhanced Chart Visualization ✓
- Updated chart title to "Product Lifecycle Cash Flow" with optional "With Development Timeline" badge
- Added linear gradients:
  - `colorDevCost` (red/orange for development costs)
  - `colorRevenue` (primary color for revenue)
  - `colorCumulative` (green for cumulative cash)
- Enhanced XAxis with angled labels for better date display
- Added `ReferenceLine` at y=0 for break-even visualization
- Added `ReferenceLine` at launch date with "🚀 Launch" label
- Customized Tooltip to show phase names + costs/revenue + cumulative cash
- Added three Area charts: `cost` (red), `revenue` (primary), `cumulative` (green)

### Step 4: Updated Legend ✓
- Shows development costs (red/orange) if phase breakdown exists
- Shows annual revenue (primary color)
- Shows cumulative cash (green)
- Shows market launch marker (dashed primary) if launch date exists

## Review
- ✓ Development phases now display on the left side of the chart as negative investment
- ✓ Launch marker clearly indicates market entry point
- ✓ Revenue projections continue post-launch showing path to profitability
- ✓ Break-even point visible relative to full project timeline
- ✓ Fallback to Year-based display if no phase dates exist
- ✓ Chart intelligently scales X-axis for both date-based phases and year-based revenue

---

(Previous plan content preserved below)

# Project Plan: Fix Genesis "Create Device" Button on /app/genesis
... (rest of file content)
