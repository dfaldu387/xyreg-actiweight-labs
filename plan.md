# Timeline Drift Detection Feature

## Status: ✅ Complete

## What it does
Detects when early phases shift from their original baseline dates and flags downstream risk — warning that later phases are likely impacted. Shows alerts in the Project Health Alerts widget.

## Changes Made

### 1. Database Migration
- Added `baseline_start_date` and `baseline_end_date` columns to `lifecycle_phases`
- These store original planned dates, set once when dates are first assigned

### 2. `TimelineDriftService.ts` (New)
- `snapshotBaseline(productId)` — copies current dates into baseline columns (only if null)
- `detectDrift(productId, productName)` — compares current vs baseline, flags drifted phases and downstream at-risk phases
- `detectDriftForProducts(productIds)` — batch detection across multiple products
- Threshold: ≥3 days drift triggers alert

### 3. `useTimelineDrift.ts` (New)
- React hook wrapping `detectDrift` with React Query caching
- Returns `{ driftAlerts, hasDrift, maxDriftDays, downstreamAtRiskCount }`

### 4. `usePersonalAlerts.ts` — Added `timeline_drift` alert type
- Queries all active products for drift detection
- Creates alerts with severity based on drift magnitude (>14 days = critical)
- Shows downstream phases at risk count in description

### 5. `phaseTimelineService.ts` — Baseline snapshot triggers
- `updatePhaseStartDate`, `updatePhaseEndDate`, `updatePhaseDates` all call `snapshotBaseline` after successful updates

### 6. `defaultPhaseDatingService.ts` — Baseline snapshot on initialization
- `initializeDefaultTimeline` calls `snapshotBaseline` after setting initial dates

### 7. `ganttChart.ts` — Updated `ProductPhase` type
- Added `baseline_start_date` and `baseline_end_date` optional fields

## Review
- Baseline dates are write-once (only set when null), preserving original plan
- Drift detection is non-blocking (snapshot errors are caught silently)
- Alerts integrate seamlessly into existing Project Health Alerts widget
- No UI changes required — alerts appear automatically when drift is detected
