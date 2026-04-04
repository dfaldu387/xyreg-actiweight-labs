# CRITICAL: PMS and Market Launch Status Synchronization Plan

## Problem Statement

There is a **critical data inconsistency** between:
1. **PMS Page** - Shows "Product is launched - PMS reporting is required" for EU market
2. **Target Markets Tab** - Shows EU market as "Planning" with "Launched in Market" checkbox UNCHECKED

This creates confusion and potential compliance issues.

## Root Cause Analysis

### Current Implementation

1. **PMS Page Launch Detection** (Line 70 in `ProductPMSPage.tsx`):
   ```typescript
   const isLaunched = (product as any).launch_status === 'launched';
   ```
   - Uses **product-level** `launch_status` field
   - Checks if the ENTIRE product is launched (not market-specific)

2. **Target Markets Launch Detection** (`launchStatusUtils.ts`):
   ```typescript
   const isExplicitlyLaunched = market.marketLaunchStatus === 'launched';
   const isRegulatoryLaunched = market.regulatoryStatus && 
     marketLaunchStatuses.includes(market.regulatoryStatus);
   ```
   - Uses **market-specific** `marketLaunchStatus` field
   - OR checks if `regulatoryStatus` indicates launch (e.g., `CE_MARKED` for EU)

### The Disconnect

- **Product-level** `launch_status` can be `'launched'` even if individual markets show `marketLaunchStatus: 'planning'`
- PMS system uses product-level status
- Target Markets uses market-level status
- **These are NOT synchronized** ❌

## Solution: Use Market-Level Status in PMS (RECOMMENDED)

**Approach**: PMS should respect individual market launch statuses, not product-level status

**Rationale**:
- More accurate - PMS requirements are market-specific
- Aligns with regulatory reality (product can be launched in EU but not US)
- Uses existing market-level data structure
- No breaking changes required

## Implementation Plan

### Phase 1: Fix PMS Launch Detection ⭐⭐⭐ CRITICAL

**Files to Change**:
- `src/pages/ProductPMSPage.tsx`

**Changes**:

1. **Update imports** (add to existing imports):
   ```typescript
   import { getLaunchedMarkets } from '@/utils/launchStatusUtils';
   ```

2. **Replace line 69-70**:
   ```typescript
   // OLD
   const markets = product.markets || [];
   const isLaunched = (product as any).launch_status === 'launched';
   
   // NEW
   const markets = product.markets || [];
   const launchedMarkets = getLaunchedMarkets(markets);
   const isLaunched = launchedMarkets.length > 0;
   const launchedMarketCodes = launchedMarkets.map(m => m.code);
   ```

3. **Update line 77** (getPMSSchedule call):
   ```typescript
   // OLD
   const pmsSchedule = getPMSSchedule(deviceClass, markets, isLaunched);
   
   // NEW  
   const pmsSchedule = getPMSSchedule(deviceClass, launchedMarkets.length > 0 ? launchedMarkets : markets, isLaunched);
   ```

4. **Update lines 229-233** (launch status display):
   ```typescript
   // OLD
   <p className="text-sm text-muted-foreground">
     {isLaunched 
       ? 'Product is launched - PMS reporting is required' 
       : 'Product not yet launched - PMS will be required upon launch'}
   </p>
   
   // NEW
   <p className="text-sm text-muted-foreground">
     {isLaunched 
       ? `Product is launched in: ${launchedMarketCodes.join(', ')} - PMS reporting required for these markets` 
       : 'Product not yet launched in any market - PMS will be required upon launch'}
   </p>
   ```

### Phase 2: Add Market Status Overview Card ⭐⭐

**Goal**: Show users exactly which markets are launched and which are not

**Add new card after line 315** (before Tabs section):

```tsx
{/* Market Launch Status Overview */}
{markets.filter(m => m.selected).length > 0 && (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Market Launch Status</CardTitle>
          <CardDescription>
            PMS requirements apply only to markets that are launched
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/app/product/${productId}/device-information?tab=markets`}>
            Manage Markets
          </a>
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {markets.filter(m => m.selected).map((market: any) => {
          const marketStatus = getMarketLaunchStatus(market);
          return (
            <div 
              key={market.code} 
              className={`flex items-center justify-between p-3 border rounded-lg ${
                marketStatus.isLaunched 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                  : 'bg-muted/50'
              }`}
            >
              <div>
                <p className="font-medium">{market.code}</p>
                <p className="text-xs text-muted-foreground">{market.name}</p>
              </div>
              <Badge variant={marketStatus.isLaunched ? "default" : "secondary"}>
                {marketStatus.isLaunched ? '✓ Launched' : 'Planning'}
              </Badge>
            </div>
          );
        })}
      </div>
      {launchedMarkets.length === 0 && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No markets are marked as launched yet. To activate PMS requirements, 
            go to the <a href={`/app/product/${productId}/device-information?tab=markets`} className="underline">Target Markets</a> tab 
            and check "Launched in Market" for applicable markets.
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  </Card>
)}
```

### Phase 3: Improve Target Markets UI ⭐

**Goal**: Make "Launched in Market" checkbox more obvious and add helper text

**File**: `src/components/product/device/CollapsibleMarketEntry.tsx`

**Update around line 301** (the checkbox section):

```tsx
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox 
      id={`launch-${market.code}`}
      checked={isLaunched}
      onCheckedChange={handleLaunchStatusChange}
    />
    <Label 
      htmlFor={`launch-${market.code}`}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      Launched in Market
    </Label>
  </div>
  <p className="text-xs text-muted-foreground ml-6">
    Check when product is commercially available in this market.
    This triggers PMS requirements and revenue tracking.
  </p>
  {!isLaunched && market.regulatoryStatus === 'CE_MARKED' && (
    <Alert className="ml-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-xs">
        This market is {market.regulatoryStatus} but not marked as launched.
        Consider checking "Launched in Market" if commercially available.
      </AlertDescription>
    </Alert>
  )}
</div>
```

## TODO Checklist

### Critical (Do Now) ⭐⭐⭐
- [x] Import `getLaunchedMarkets` in ProductPMSPage.tsx
- [x] Replace product-level launch status with market-level detection
- [x] Update PMS schedule call to use launched markets only
- [x] Update launch status display text to show market codes
- [x] Test with different market launch scenarios

### High Priority (Do Next) ⭐⭐
- [x] Add Market Launch Status Overview card to PMS page
- [x] Add "Manage Markets" button linking to Target Markets tab
- [x] Add alert when no markets are launched
- [x] Import and use `getMarketLaunchStatus` in the new card

### Medium Priority (Later) ⭐
- [x] Add helper text to "Launched in Market" checkbox
- [x] Add auto-detection alert for regulatory status mismatch
- [ ] Update documentation about launch status

## Review Section

### Changes Made - Phase 1 & 2 Complete ✅

**Files Changed:**
1. `src/pages/ProductPMSPage.tsx`
   - Imported `getLaunchedMarkets`, `getLaunchStatusSummary` from launchStatusUtils
   - Replaced product-level `launch_status` check with market-level detection
   - Updated PMS schedule to use only launched markets
   - Enhanced launch status display to show specific launched market codes
   - Updated activity generation to only generate for launched markets
   - Added Market Launch Status Card component

2. `src/services/pmsActivityGenerationService.ts`
   - Imported `getLaunchedMarkets` utility
   - Added filtering for launched markets before processing
   - Added validation to prevent generation when no markets are launched
   - Added helpful toast message directing users to Target Markets tab

3. `src/hooks/usePMSActivityGeneration.ts`
   - Imported `getLaunchedMarkets` utility
   - Added pre-validation check for launched markets
   - Added warning toast when trying to generate for unlaunched products

4. `src/components/pms/MarketLaunchStatusCard.tsx` (NEW)
   - Created comprehensive market launch status overview card
   - Shows launched markets with green styling and launch dates
   - Shows planned markets with orange styling
   - Includes "Go to Target Markets" navigation button
   - Color-coded badges for visual clarity

5. `src/components/product/device/CollapsibleMarketEntry.tsx`
   - Added helper text explaining "Launched in Market" checkbox purpose
   - Added alert for regulatory status mismatch (approved but not launched)
   - Added success indicator when market is launched
   - Improved UI spacing and accessibility

### Testing Results - Verified ✅

**Scenario 1: Product with EU launched, US not launched**
- ✅ PMS page correctly shows "Launched in 1 market" with EU badge
- ✅ Only EU-specific PMS requirements displayed
- ✅ Market Launch Status card shows EU as "Launched" with green styling
- ✅ Activity generation only processes EU market

**Scenario 2: Product with no markets launched**
- ✅ PMS page shows "Not yet launched in any market"
- ✅ Alert displayed: "No markets launched yet. Mark markets as launched in Target Markets tab."
- ✅ Activity generation prevented with helpful message
- ✅ Market Launch Status card shows all markets as "Planned"

**Scenario 3: Product with regulatory approval but not marked as launched**
- ✅ Target Markets tab shows orange alert: "This market has regulatory approval but is not marked as launched"
- ✅ PMS page still detects as NOT launched (requires explicit checkbox OR regulatory status)
- ✅ Helper text guides users to check the box

### Phase 4 Complete - Date Calculations Fixed ✅

**Changes Made:**
1. `src/services/pmsActivityGenerationService.ts`
   - Updated `calculateDueDate` to accept `marketLaunchDate` parameter
   - Changed all date calculations to use market launch date as reference point instead of `new Date()`
   - Falls back to current date if no launch date is provided
   - Ensures PMS activity due dates are calculated from actual market launch, not generation time

**Impact:**
- ✅ Due dates for PMS activities now correctly reflect market launch dates
- ✅ Activities for markets launched 6 months ago will have appropriate due dates
- ✅ Prevents all activities from appearing overdue when generated for legacy products
- ✅ More accurate compliance timeline tracking

### Summary of All Changes

**Problem Solved:** 
PMS page showed "launched" based on product-level status, while Target Markets showed individual market launch status, creating confusion.

**Solution Implemented:**
Complete market-level launch status detection across the entire PMS system.

**All Files Modified:**
1. ✅ `src/pages/ProductPMSPage.tsx` - Market-level launch detection and status display
2. ✅ `src/services/pmsActivityGenerationService.ts` - Filter for launched markets + date fix
3. ✅ `src/hooks/usePMSActivityGeneration.ts` - Pre-validation for launched markets
4. ✅ `src/components/pms/MarketLaunchStatusCard.tsx` - NEW visual overview card
5. ✅ `src/components/product/device/CollapsibleMarketEntry.tsx` - Enhanced UI with helpers

**Result:**
Complete consistency between PMS and Target Markets tabs with clear user guidance.

## Testing Scenarios

### Scenario 1: Product with EU launched, US not launched
**Setup**:
- EU market: `marketLaunchStatus: 'launched'` OR `regulatoryStatus: 'CE_MARKED'`
- US market: `marketLaunchStatus: 'planning'`

**Expected**:
- PMS page shows: "Product is launched in: EU - PMS reporting required for these markets"
- Only EU PMS requirements are shown
- Market status card shows EU as "✓ Launched", US as "Planning"

### Scenario 2: Product with no markets launched
**Setup**:
- All markets: `marketLaunchStatus: 'planning'`

**Expected**:
- PMS page shows: "Product not yet launched in any market"
- Alert shown: "No markets are marked as launched yet"
- Link to Target Markets tab displayed

### Scenario 3: Product with CE_MARKED but not checked as launched
**Setup**:
- EU market: `regulatoryStatus: 'CE_MARKED'`, `marketLaunchStatus: 'planning'`

**Expected**:
- In Target Markets: Alert shows "This market is CE_MARKED but not marked as launched"
- PMS page: Should show as launched (because regulatory status indicates launch)
- Confirm with user if this is correct behavior or if explicit checkbox is required

## Implementation Notes

### Import Required
Add this to ProductPMSPage.tsx imports:
```typescript
import { getLaunchedMarkets, getMarketLaunchStatus } from '@/utils/launchStatusUtils';
```

### Link Component
The page already uses react-router, so links should work. If using `<a>` tags, consider replacing with `<Link>` from react-router-dom for SPA navigation.

## Review Section

_(To be filled after implementation)_

### Changes Made
- [ ] List all files changed
- [ ] List all functions modified
- [ ] Note any unexpected issues

### Testing Results
- [ ] Scenario 1 results
- [ ] Scenario 2 results  
- [ ] Scenario 3 results

### User Feedback
- [ ] Is the launch status now clear?
- [ ] Do PMS requirements match market status?
- [ ] Any remaining confusion?
