# Company Context Jumping Issue - Analysis & Fix Plan

## Problem Statement

The system loses company context unexpectedly when:
- Switching between pages (especially to Genesis/Venture Blueprint)
- After period of inactivity
- When navigating to routes without company in URL (e.g., `/app/product-family/:basicUdi`)
- Opening multiple browser tabs

---

## Root Cause Analysis

### 1. Multiple Sources of Truth

The system has **5 different sources** for company ID with conflicting priorities:

| Priority | Source | Location | Problem |
|----------|--------|----------|---------|
| 1 | URL | `/app/company/:companyName/...` | Changes on every navigation |
| 2 | sessionStorage | `xyreg_company_context` | Expires after 30 min |
| 3 | User Metadata | `supabase.auth.user.user_metadata.activeCompany` | Can be stale |
| 4 | Primary Company | `is_primary` flag in DB | May not be user's preferred |
| 5 | First Alphabetically | Fallback | Unpredictable |

### 2. Conflicting Hooks

```typescript
// useCompanyId() - reads from URL or localStorage (can be stale)
const companyIdFromHook = useCompanyId();

// activeCompanyRole - from React context (current session)
const { activeCompanyRole } = useCompanyRole();

// PROBLEM: Different components use different sources
const companyId = companyIdFromHook || activeCompanyRole?.companyId;
```

### 3. SessionStorage Expiration

```typescript
// In useCompanyRoles.ts (lines 145-156)
if (Date.now() - context.lastUpdated < 30 * 60 * 1000) {
  persistedCompanyId = context.companyId;
} else {
  sessionStorage.removeItem('xyreg_company_context'); // CONTEXT LOST!
}
```

After 30 minutes of inactivity, the company context is cleared and falls back to metadata or primary company.

### 4. DevMode Auto-Synchronization

```typescript
// In useCompanyRoles.ts (lines 267-293)
useEffect(() => {
  if (devModeContext?.isDevMode && devModeContext?.selectedCompanies?.length > 0) {
    // Automatically switches company without user action
    setActiveCompanyRole(matchingRole);
  }
}, [devModeContext, companyRoles]);
```

### 5. URL Parsing on Every Navigation

```typescript
// In useCompanyRoles.ts (lines 104-134)
// Every URL change triggers this
const match = pathname.match(/\/app\/company\/([^\/]+)/);
if (match) {
  // Updates sessionStorage to match URL - can override user's selection
  sessionStorage.setItem('xyreg_company_context', ...);
}
```

### 6. Race Conditions

```typescript
// 2-second circuit breaker forces completion even if data not ready
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (isLoading) {
      setIsLoading(false); // May render with wrong context
    }
  }, 2000);
}, [isLoading]);
```

---

## Proposed Solutions

### Solution 1: Single Source of Truth (Recommended)

**Principle:** Use `activeCompanyRole` from React Context as the ONLY source of truth.

#### Changes Required:

**A. Create a centralized company context hook:**

```typescript
// src/hooks/useCurrentCompany.ts (NEW FILE)
export function useCurrentCompany() {
  const { activeCompanyRole, isLoading } = useCompanyRole();

  return {
    companyId: activeCompanyRole?.companyId || null,
    companyName: activeCompanyRole?.companyName || null,
    role: activeCompanyRole?.role || 'viewer',
    isLoading,
  };
}
```

**B. Replace all usages of mixed sources:**

```typescript
// BEFORE (in multiple files):
const companyIdFromHook = useCompanyId();
const { activeCompanyRole } = useCompanyRole();
const companyId = companyIdFromHook || activeCompanyRole?.companyId;

// AFTER:
const { companyId } = useCurrentCompany();
```

**C. Files to update:**
- `src/pages/ProductFamilyDashboard.tsx`
- `src/components/test/L2ContextualBar.tsx`
- Any other component using `useCompanyId()` with `useCompanyRole()`

---

### Solution 2: Increase SessionStorage Expiration

**Current:** 30 minutes
**Proposed:** 24 hours or session-based (no expiration until browser closes)

```typescript
// In useCompanyRoles.ts
// BEFORE:
if (Date.now() - context.lastUpdated < 30 * 60 * 1000) {

// AFTER (24 hours):
if (Date.now() - context.lastUpdated < 24 * 60 * 60 * 1000) {

// OR remove expiration entirely (session-based):
// sessionStorage automatically clears when browser closes
```

---

### Solution 3: Prevent URL Override of User Selection

**Problem:** Navigating to a URL with a different company switches context automatically.

**Solution:** Only update context from URL on explicit company switch, not on every navigation.

```typescript
// In useCompanyRoles.ts - Add flag to track intentional switches
const [isIntentionalSwitch, setIsIntentionalSwitch] = useState(false);

// Only sync URL to context on intentional navigation
if (match && isIntentionalSwitch) {
  // Update context
  setIsIntentionalSwitch(false);
}
```

---

### Solution 4: Disable DevMode Auto-Sync (Optional)

If DevMode auto-sync is causing issues, make it opt-in:

```typescript
// In useCompanyRoles.ts (lines 267-293)
useEffect(() => {
  // Only sync if user explicitly enables it
  if (devModeContext?.isDevMode &&
      devModeContext?.autoSyncCompany && // NEW FLAG
      devModeContext?.selectedCompanies?.length > 0) {
    // ... sync logic
  }
}, [devModeContext, companyRoles]);
```

---

### Solution 5: Add Company Context Persistence Layer

Create a dedicated service for company context management:

```typescript
// src/services/companyContext.ts (NEW FILE)
class CompanyContextService {
  private static STORAGE_KEY = 'xyreg_company_context';

  static get(): { companyId: string; companyName: string } | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  static set(companyId: string, companyName: string): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      companyId,
      companyName,
      lastUpdated: Date.now()
    }));
  }

  static clear(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  // Only update if intentional (user clicked, not navigation)
  static updateIfIntentional(companyId: string, companyName: string, isIntentional: boolean): void {
    if (isIntentional) {
      this.set(companyId, companyName);
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Quick Fixes (Immediate)

1. **[DONE]** Fix priority in ProductFamilyDashboard and L2ContextualBar
   - Changed `companyIdFromHook || activeCompanyRole` to `activeCompanyRole || companyIdFromHook`

2. **[TODO]** Increase sessionStorage expiration to 24 hours
   - File: `src/hooks/useCompanyRoles.ts`
   - Line: ~145

### Phase 2: Refactoring (Short-term)

1. Create `useCurrentCompany` hook as single source of truth
2. Audit and replace all mixed company ID usages
3. Add logging to track context switches for debugging

### Phase 3: Architecture Improvements (Long-term)

1. Implement CompanyContextService for centralized management
2. Add user preference for "sticky" company (don't auto-switch)
3. Add UI indicator when company context changes
4. Consider using React Query for company state management

---

## Files Affected

| File | Current Issue | Fix Required |
|------|---------------|--------------|
| `src/hooks/useCompanyRoles.ts` | Multiple sources, expiration, DevMode sync | Refactor priority logic |
| `src/hooks/useCompanyId.ts` | Returns stale data | Deprecate or fix |
| `src/pages/ProductFamilyDashboard.tsx` | Mixed sources | Use single source |
| `src/components/test/L2ContextualBar.tsx` | Mixed sources | Use single source |
| `src/context/CompanyRoleContext.tsx` | Wrapper only | May need enhancement |

---

## Testing Checklist

After implementing fixes, test these scenarios:

### Basic Navigation Tests
- [ ] Navigate between pages - company should not change
- [ ] Navigate to `/app/product-family/:basicUdi` - should use active company
- [ ] Navigate to Genesis/Venture Blueprint - company should persist
- [ ] Click sidebar items - company should not jump

### Session Persistence Tests
- [ ] Refresh page - company should persist
- [ ] Wait 30+ minutes idle - company should persist (now 24-hour expiration)
- [ ] Open multiple tabs - company should be consistent
- [ ] Close and reopen browser - company should restore (within 24 hours)

### Company Switching Tests
- [ ] Switch company manually via dropdown - should persist correctly
- [ ] After manual switch, navigate to other pages - should stay on selected company
- [ ] After manual switch, URL with different company should NOT override selection

### DevMode Tests (if applicable)
- [ ] Enable DevMode - should NOT auto-switch if user has intentional selection
- [ ] DevMode sync should only happen if no intentional selection exists

### Edge Cases
- [ ] Log out and log in - company should restore from metadata
- [ ] User with multiple companies - should remember last selection
- [ ] Navigate directly via URL to company route - should work correctly

## Debug Tools

Enable debug logging in browser console:
```javascript
// Enable debug mode
companyContextDebug.enable()

// Get current context summary
companyContextDebug.getSummary()

// Disable debug mode
companyContextDebug.disable()
```

Monitor context in real-time:
```javascript
// Watch for context changes
const { CompanyContextService } = await import('/src/services/companyContext.ts');
CompanyContextService.subscribe((ctx) => console.log('Context changed:', ctx));
```

---

## Debugging Tips

Add this to browser console to monitor company context:

```javascript
// Monitor sessionStorage changes
const originalSetItem = sessionStorage.setItem;
sessionStorage.setItem = function(key, value) {
  if (key === 'xyreg_company_context') {
    console.log('[Company Context Changed]', JSON.parse(value));
    console.trace();
  }
  originalSetItem.apply(this, arguments);
};
```

---

## Summary

The company context jumping is caused by:

1. **Multiple conflicting sources** - URL, sessionStorage, metadata, etc.
2. **SessionStorage expiration** - 30 min timeout
3. **DevMode auto-sync** - Changes company without user action
4. **URL parsing** - Every navigation can override context
5. **Race conditions** - Async loading with circuit breaker

**Recommended approach:** Implement Solution 1 (Single Source of Truth) combined with Solution 2 (Increase expiration) for the most stable fix.
