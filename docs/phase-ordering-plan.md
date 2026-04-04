# Project Plan: Fix Phase Ordering

## Problem
Phase ordering was incorrect due to all phases being marked as `is_predefined_core_phase = false`, causing them to sort by position instead of logical lifecycle order.

## Solution Implemented ✅

### Database Cleanup
- [x] Removed duplicate "Launch (16)" phase
- [x] Renamed "Design Planning (02)" to "Project Initiation & Design Planning (02)"

### Enhanced Sorting Logic
- [x] Updated `sortPhasesByLogicalOrder` to handle numeric prefixes as fallback
- [x] Applied sorting to both active and available phases in `ConsolidatedPhaseDataService`
- [x] Updated `AvailablePhasesCard` to use logical sorting

### Code Changes Made
1. **src/utils/phaseOrderingUtils.ts** - Enhanced sorting logic to prioritize numeric prefixes
2. **src/components/settings/phases/ConsolidatedPhaseDataService.ts** - Applied sorting to active phases
3. **src/components/settings/phases/AvailablePhasesCard.tsx** - Applied sorting to available phases

## Expected Result
Phases now display in proper lifecycle order:
- (01) Concept & Feasibility
- (02) Project Initiation & Design Planning  
- (03) User Needs & Requirements
- (04) Design Input
- (05) Design Output
- (06) Verification
- (07) Validation
- (08) Design Transfer
- (09) Risk Management
- (10) Pre-Market Activities
- (11) Technical Documentation
- (12) Launch
- (13) PMS Setup
- (14) Post-Market Surveillance
- (15) Post-Market Updates

## Review
The implementation successfully addresses the phase ordering issue through enhanced sorting logic that handles numeric prefixes correctly, ensuring both active and available phases display in the proper medical device lifecycle sequence.

**Key Achievement**: The sorting logic now works regardless of the `is_predefined_core_phase` flag state, making it more resilient to database inconsistencies.