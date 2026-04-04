# Company Context Redirect Issue - Root Cause Analysis

## Executive Summary

**ROOT CAUSE:** Race condition between `useCompanyRoles.ts` (correct initialization) and multiple redundant fallback mechanisms that trigger BEFORE initialization completes.

**MOST LIKELY CULPRIT:** `CompanyRouteGuard.tsx` line 40-47 - checks `hasAccess` which depends on async validation, triggers redirect to `companyRoles[0]` before URL company is validated.

---

## The Correct Flow (How It Should Work)

```
1. User navigates to /app/company/Nox%20Medical
2. useCompanyRoles.ts reads URL → finds "Nox Medical" in user's companies
3. Sets activeCompanyRole = "Nox Medical"
4. Updates sessionStorage to match URL
5. Done - user stays on Nox Medical
```

## The Actual Flow (What's Happening)

```
1. User navigates to /app/company/Nox%20Medical
2. useCompanyRoles.ts STARTS loading (async)
3. activeCompanyRole = null (loading...)
4. CompanyRouteGuard sees hasAccess = false (still validating)
5. CompanyRouteGuard redirects to companyRoles[0] = "AA Co"
6. useCompanyRoles.ts finishes, but user is already on "AA Co"
```

---

## Classification of All Fallback Mechanisms

### USEFUL (Keep)

| File | Mechanism | Purpose | Issue |
|------|-----------|---------|-------|
| `useCompanyRoles.ts` | URL > sessionStorage > metadata priority | **SOURCE OF TRUTH** | None - this is correct |
| `CompanyRouteGuard.tsx` | Security guard for company routes | Prevent unauthorized access | Triggers too early during loading |
| `ProtectedRoute.tsx` | Route-level access control | Security | Multiple `companyRoles[0]` fallbacks |

### USELESS / REDUNDANT (Remove or Disable)

| File | Mechanism | Why Useless |
|------|-----------|-------------|
| `useCompanyContextPersistence.ts` | `recoverCompanyContext()` | **DUPLICATE** - `useCompanyRoles.ts` already reads sessionStorage |
| `useSidebarData.ts` | `bridgeProductToCompanyContext()` | **REDUNDANT** - Tries to switch company based on product, interferes with URL |
| `useSidebarData.ts` | `attemptContextRecovery()` | **REDUNDANT** - Calls `recoverCompanyContext()` which is already duplicate |
| `useSidebarData.ts` | Lines 64, 79, 116 - `companyRoles[0]` fallbacks | **HARMFUL** - Sets wrong company context |
| `useCompanyContextValidation.ts` | `validateContext()` | **DUPLICATE** - `CompanyRouteGuard` already does this |
| `useRouteProtection.ts` | Lines 56, 67, 90 navigations | **DUPLICATE** - `ProtectedRoute` and `CompanyRouteGuard` already handle this |

---

## Detailed Analysis

### 1. `useCompanyRoles.ts` - THE SOURCE OF TRUTH

**Status:** CORRECT - Keep as is

```typescript
// Lines 99-166: Priority order
// URL > sessionStorage > metadata > primary > first
let activeCompanyId = urlCompanyId || persistedCompanyId || metadataCompanyId;
```

This is the CORRECT implementation. It:
- Reads URL first (highest priority)
- Falls back to sessionStorage (for page refresh)
- Falls back to metadata (for login)
- Falls back to primary/first company (new users)

**Issue:** It's async, so `activeCompanyRole` is `null` during loading.

---

### 2. `useCompanyContextPersistence.ts` - USELESS

**Status:** REDUNDANT - Should be REMOVED or DISABLED

```typescript
// recoverCompanyContext() - Lines 130-168
// Reads from sessionStorage and calls switchCompanyRole()
```

**Why Useless:**
- `useCompanyRoles.ts` ALREADY reads sessionStorage at lines 136-157
- This is DUPLICATE functionality
- Calling `switchCompanyRole()` can override the correct URL-based context

**Recommendation:** DELETE this entire hook or disable `recoverCompanyContext()`

---

### 3. `useSidebarData.ts` - MULTIPLE USELESS FALLBACKS

**Status:** HARMFUL - Should be REMOVED

#### 3a. Lines 64, 79, 116 - `companyRoles[0]` fallbacks

```typescript
// Line 64 - Communication routes
currentCompany = companyRoles[0].companyName;

// Line 79 - Product-family routes
currentCompany = companyRoles[0].companyName;

// Line 116 - Mission control
currentCompany = companyRoles[0].companyName;
```

**Why Useless:**
- These routes should use `activeCompanyRole` which is already set by `useCompanyRoles.ts`
- Setting `currentCompany` to `companyRoles[0]` can show wrong sidebar items

#### 3b. `bridgeProductToCompanyContext()` - Lines 153-206

**Why Useless:**
- Tries to switch company based on product owner
- But if URL has `/app/company/X`, user intentionally navigated to company X
- This can override user's explicit navigation

#### 3c. `attemptContextRecovery()` - Lines 208-241

**Why Useless:**
- Calls `recoverCompanyContext()` which is already redundant
- Triggers when `!activeCompanyRole` (during loading)
- Can override URL-based context

**Recommendation:** DELETE lines 64, 79, 116 fallbacks and both recovery functions

---

### 4. `useRouteProtection.ts` - DUPLICATE

**Status:** REDUNDANT - Should be REMOVED or SIMPLIFIED

```typescript
// Lines 56, 67, 90
navigate(`/app/company/${encodeURIComponent(companyRoles[0].companyName)}`);
```

**Why Useless:**
- `ProtectedRoute.tsx` already handles route protection
- `CompanyRouteGuard.tsx` already handles company access validation
- This is a THIRD layer of protection doing the same thing

**Recommendation:** DELETE this hook entirely - it's redundant with ProtectedRoute

---

### 5. `useCompanyContextValidation.ts` - DUPLICATE

**Status:** REDUNDANT - Should be REMOVED

```typescript
// Line 39
navigate(`/app/company/${encodeURIComponent(companyRoles[0].companyName)}`);
```

**Why Useless:**
- `CompanyRouteGuard.tsx` already validates company access
- This is DUPLICATE validation causing double redirects

**Recommendation:** DELETE this hook entirely

---

### 6. `ProtectedRoute.tsx` - PARTIALLY USEFUL

**Status:** USEFUL but has issues

```typescript
// Lines 93, 149, 182 - Fallbacks to companyRoles[0]
```

**Why Useful:** Handles route-level security for roles

**Issue:** Falls back to `companyRoles[0]` when `!activeCompanyRole` during loading

**Recommendation:** Add check for URL company before falling back

---

### 7. `CompanyRouteGuard.tsx` - THE MAIN SECURITY GUARD (AND ROOT CAUSE)

**Status:** USEFUL but is THE ROOT CAUSE of redirect

```typescript
// Lines 40-47
if (!hasAccess) {
  if (companyRoles.length > 0) {
    const fallbackCompany = companyRoles[0];
    return <Navigate to={`/app/company/${...fallbackCompany.companyName}`} />;
  }
}
```

**Why It's The Root Cause:**
1. User navigates to `/app/company/Nox%20Medical`
2. `CompanyRouteGuard` renders
3. `useCompanyAccessValidator` starts async validation
4. While validating, `hasAccess = false` (loading state)
5. Guard sees `!hasAccess` and redirects to `companyRoles[0]` = "AA Co"
6. User ends up on wrong company

**Fix:** Check if URL company exists in `companyRoles` BEFORE async validation completes

---

## Root Cause Summary

### Primary Root Cause: `CompanyRouteGuard.tsx`
- Redirects to `companyRoles[0]` before async validation completes
- Should check if URL company is in user's roles synchronously first

### Secondary Root Cause: Multiple Redundant Systems
- 4+ different systems trying to "recover" or "validate" company context
- Each one can override the correct URL-based context
- Race conditions between these systems

---

## Recommended Fix Order

### Phase 1: Remove Redundant Systems (Quick Wins)
1. DELETE or DISABLE `useCompanyContextPersistence.ts` - `recoverCompanyContext()`
2. DELETE or DISABLE `useSidebarData.ts` - `bridgeProductToCompanyContext()` and `attemptContextRecovery()`
3. DELETE `useCompanyContextValidation.ts` entirely
4. DELETE `useRouteProtection.ts` entirely

### Phase 2: Fix CompanyRouteGuard (Root Cause)
```typescript
// Add synchronous check BEFORE async validation
if (!hasAccess && !isLoading) {
  // Before redirecting, check if URL company is in user's roles
  const urlCompanyInRoles = companyRoles.some(role =>
    role.companyName.toLowerCase() === companyName?.toLowerCase()
  );

  if (urlCompanyInRoles) {
    // User HAS access, just waiting for validation
    // Don't redirect, let validation complete
    return <>{children}</>;
  }

  // User really doesn't have access, redirect
  return <Navigate to={...} />;
}
```

### Phase 3: Simplify ProtectedRoute
- Remove `companyRoles[0]` fallbacks where URL company should be respected

---

## Files to Modify

| File | Action |
|------|--------|
| `useCompanyContextPersistence.ts` | Disable `recoverCompanyContext()` or delete file |
| `useSidebarData.ts` | Remove lines 64, 79, 116 and both recovery functions |
| `useCompanyContextValidation.ts` | DELETE entire file |
| `useRouteProtection.ts` | DELETE entire file |
| `CompanyRouteGuard.tsx` | Add synchronous role check before redirect |
| `ProtectedRoute.tsx` | Add URL check before `companyRoles[0]` fallbacks |

---

## Principle

**URL is the single source of truth.**

If URL says `/app/company/Nox%20Medical`, and user has access to "Nox Medical", NO fallback mechanism should override this. Period.
