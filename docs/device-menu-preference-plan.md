# Device Menu Preference - Implementation Plan (localStorage)

## Overview

When a user selects a device and navigates to Documents > Company section and selects a menu, the app should remember this selection. When the user reopens the same device, it should directly show the previously selected menu.

---

## Status: IMPLEMENTED ✅

All files have been created and integrated.

---

## Implementation Summary

### Files Created

| File | Description |
|------|-------------|
| `src/services/devicePreferenceService.ts` | Core service for localStorage operations |
| `src/hooks/useDeviceMenuPreference.ts` | Hook for device menu preferences |
| `src/hooks/useCompanyMenuPreference.ts` | Hook for company menu preferences |

### Files Modified

| File | Change |
|------|--------|
| `src/context/AuthContext.tsx` | Added preference cleanup on logout |

---

## Key Pattern (SECURITY)

```
xyreg_user_{userId}_company_{companyId}_device_{deviceId}_menu_preference
```

| Part | Description |
|------|-------------|
| `xyreg_` | App prefix (prevents collision) |
| `user_{userId}` | User isolation - REQUIRED |
| `company_{companyId}` | Company isolation |
| `device_{deviceId}` | Device-specific |
| `menu_preference` | Preference type |

### Example Keys

```
xyreg_user_abc123_company_comp1_device_dev456_menu_preference
xyreg_user_abc123_company_comp1_device_dev789_menu_preference
xyreg_user_xyz999_company_comp1_device_dev456_menu_preference  // Different user
```

---

## Security Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Every key includes userId | ✅ Implemented |
| 2 | Every key includes companyId | ✅ Implemented |
| 3 | Clear on logout | ✅ Implemented |
| 4 | 30-day auto-expiry | ✅ Implemented |
| 5 | Validation before read/write | ✅ Implemented |

---

## Usage Examples

### Device Menu Preference

```typescript
import { useDeviceMenuPreference } from "@/hooks/useDeviceMenuPreference";

function DeviceDocumentsPage({ companyId, deviceId }) {
  const { preference, isLoading, updatePreference, clearPreference } =
    useDeviceMenuPreference(companyId, deviceId);

  // Apply saved preference on load
  useEffect(() => {
    if (preference && !isLoading) {
      setSelectedSection(preference.selectedSection);
      setSelectedMenuId(preference.selectedMenuId);
    }
  }, [preference, isLoading]);

  // Save when menu changes
  const handleMenuSelect = (section: string, menuId: string) => {
    updatePreference({
      selectedSection: section,
      selectedMenuId: menuId,
    });
  };
}
```

### Company Menu Preference

```typescript
import { useCompanyMenuPreference } from "@/hooks/useCompanyMenuPreference";

function CompanyDocumentsPage({ companyId }) {
  const { preference, updatePreference } = useCompanyMenuPreference(companyId);

  // Save when menu changes
  const handleMenuSelect = (menuId: string) => {
    updatePreference({
      selectedMenuId: menuId,
    });
  };
}
```

---

## Data Structures

### DeviceMenuPreference

```typescript
interface DeviceMenuPreference {
  selectedSection: string;      // e.g., 'company', 'product', 'phases'
  selectedMenuId: string;       // Selected menu ID
  selectedSubMenuId?: string;   // Optional sub-menu
  selectedTab?: string;         // Optional tab
  lastVisited: string;          // ISO timestamp
}
```

### CompanyMenuPreference

```typescript
interface CompanyMenuPreference {
  selectedMenuId: string;       // Selected menu ID
  selectedSubMenuId?: string;   // Optional sub-menu
  viewType?: string;            // Optional view type (list/grid)
  lastVisited: string;          // ISO timestamp
}
```

---

## Service API

### Device Preferences

```typescript
// Get preference
getDeviceMenuPreference(userId, companyId, deviceId): DeviceMenuPreference | null

// Set preference
setDeviceMenuPreference(userId, companyId, deviceId, preference): boolean

// Remove preference
removeDeviceMenuPreference(userId, companyId, deviceId): boolean
```

### Company Preferences

```typescript
// Get preference
getCompanyMenuPreference(userId, companyId): CompanyMenuPreference | null

// Set preference
setCompanyMenuPreference(userId, companyId, preference): boolean

// Remove preference
removeCompanyMenuPreference(userId, companyId): boolean
```

### Cleanup (called on logout)

```typescript
// Clear ALL preferences for a user (includes L1/L2 memory data)
clearAllUserPreferences(userId): void

// Clear preferences for a specific company
clearCompanyPreferences(userId, companyId): void
```

**Keys cleared on logout:**
- `xyreg_user_{userId}_*` - All device/company menu preferences
- `lastSelectedProduct_{userId}_*` - L1 device memory
- `lastSelectedProductRoute_{userId}_*` - L1 device route memory
- `lastSelectedCompanyRoute_{userId}_*` - L1 company route memory
- `lastSelectedCompany` - Last selected company (global)
- `recentProducts` - Recently viewed products (global)

---

## Logout Integration

The `signOut` function in `AuthContext.tsx` now automatically clears all user preferences:

```typescript
const signOut = async (): Promise<void> => {
  const currentUserId = user?.id;

  // ... logout logic ...

  // Clear all device/menu preferences for this user (CRITICAL for security)
  if (currentUserId) {
    clearAllUserPreferences(currentUserId);
    console.log('Cleared all user preferences on sign out');
  }
};
```

---

## Testing Checklist

### User Isolation Tests

- [ ] Login as User A, select menu on Device 1
- [ ] Logout User A
- [ ] Login as User B, open Device 1 → Should NOT see User A's selection
- [ ] User B selects different menu
- [ ] Logout User B, login as User A → User A should see their original selection

### Logout Tests

- [ ] Login as User A, save preferences on multiple devices
- [ ] Logout User A
- [ ] Check localStorage → No `xyreg_user_${userA_id}_` keys should exist
- [ ] Login as User A again → No preferences (all cleared)

### Persistence Tests

- [ ] Select menu, refresh page → Selection persists
- [ ] Select menu, close browser, reopen → Selection persists
- [ ] Select menu, wait 31 days → Selection cleared (expiry)

---

## L1 Module Switching - Integration Complete ✅

When user switches from L1 Device to L1 Company and back, the last device and menu are restored.

### How It Works

1. **User is on L1 Device → Device X → Documents menu**
2. **User switches to L1 Company (Portfolio)**
3. **User clicks L1 Device again → automatically opens Device X on Documents menu**

### Files Modified

#### `src/components/test/L2ContextualBar.tsx`

**Helper functions (CRITICAL - must include companyId):**
```typescript
// CRITICAL: All localStorage keys MUST include both userId AND companyId for data isolation
const getLastSelectedProductKey = () => {
  if (!user?.id || !companyId) return 'lastSelectedProduct';
  return `lastSelectedProduct_${user.id}_${companyId}`;
};

const getLastSelectedProductRouteKey = () => {
  if (!user?.id || !companyId) return 'lastSelectedProductRoute';
  return `lastSelectedProductRoute_${user.id}_${companyId}`;
};
```

**Route saving on navigation:**
```typescript
// Store current product route when on a product page
useEffect(() => {
  if (activeModule === 'products' && currentProductId && location.pathname.includes('/product/') && companyId && user?.id) {
    const currentPath = location.pathname + location.search;
    const productKey = getLastSelectedProductKey();
    const routeKey = getLastSelectedProductRouteKey();
    localStorage.setItem(productKey, currentProductId);
    localStorage.setItem(routeKey, currentPath);
  }
}, [activeModule, currentProductId, location.pathname, location.search, user?.id, companyId]);
```

#### `src/components/layout/AppLayout.tsx`

**Helper functions (CRITICAL - must include companyId):**
```typescript
// CRITICAL: All localStorage keys MUST include both userId AND companyId for data isolation
const getLastSelectedProductKey = () => {
  if (!user?.id || !companyId) return 'lastSelectedProduct';
  return `lastSelectedProduct_${user.id}_${companyId}`;
};

const getLastSelectedProductRouteKey = () => {
  if (!user?.id || !companyId) return 'lastSelectedProductRoute';
  return `lastSelectedProductRoute_${user.id}_${companyId}`;
};

const getLastSelectedCompanyRouteKey = () => {
  if (!user?.id || !companyId) return 'lastSelectedCompanyRoute';
  return `lastSelectedCompanyRoute_${user.id}_${companyId}`;
};
```

**Route restoration on L1 module switch:**
```typescript
if (moduleId === 'products') {
  const productKey = getLastSelectedProductKey();
  const routeKey = getLastSelectedProductRouteKey();
  const lastProduct = localStorage.getItem(productKey);
  const lastRoute = localStorage.getItem(routeKey);

  if (lastProduct && lastRoute && lastRoute.includes('/product/')) {
    // Restore the last viewed device and navigate to the last menu
    setSelectedProduct(lastProduct);
    navigate(lastRoute);
  } else {
    // No stored state - show all device families
    setSelectedProduct(null);
  }
}
```

### localStorage Keys (User AND Company Isolated)

**CRITICAL:** Keys MUST include both `userId` AND `companyId` to prevent data leaks when switching between companies.

```
lastSelectedProduct_{userId}_{companyId}       → Device ID
lastSelectedProductRoute_{userId}_{companyId}  → Device route path
lastSelectedCompanyRoute_{userId}_{companyId}  → Company route path
```

**Security Fix (Dec 2025):** Previously keys only used `userId`, which caused data from one company to leak when switching to another company. Now all keys include `companyId` for proper data isolation.

---

## L1 Company (Portfolio) Module Switching - Integration Complete ✅

Same functionality for Portfolio module.

### How It Works

1. **User is on L1 Company (Portfolio) → Device Portfolio menu**
2. **User switches to L1 Device**
3. **User clicks L1 Company again → automatically opens Device Portfolio menu**

### Changes Made

#### `src/components/layout/AppLayout.tsx`

**Helper function (CRITICAL - must include companyId):**
```typescript
// CRITICAL: All localStorage keys MUST include both userId AND companyId for data isolation
const getLastSelectedCompanyRouteKey = () => {
  if (!user?.id || !companyId) return 'lastSelectedCompanyRoute';
  return `lastSelectedCompanyRoute_${user.id}_${companyId}`;
};
```

**Route saving on navigation** (lines 622-631):
```typescript
useEffect(() => {
  if (activeModule === 'portfolio' && location.pathname.includes('/company/') && companyId && user?.id) {
    const currentPath = location.pathname + location.search;
    const routeKey = getLastSelectedCompanyRouteKey();
    localStorage.setItem(routeKey, currentPath);
  }
}, [activeModule, location.pathname, location.search, user?.id, companyId]);
```

**Route saving on module switch** (lines 866-874):
```typescript
if (activeModule === 'portfolio' && companyId && user?.id) {
  const currentPath = location.pathname + location.search;
  if (location.pathname.includes('/company/')) {
    const companyRouteKey = getLastSelectedCompanyRouteKey();
    localStorage.setItem(companyRouteKey, currentPath);
  }
}
```

**Route restoration on L1 module switch** (lines 897-914):
```typescript
if (moduleId === 'portfolio') {
  const companyRouteKey = getLastSelectedCompanyRouteKey();
  const lastCompanyRoute = localStorage.getItem(companyRouteKey);

  if (lastCompanyRoute && lastCompanyRoute.includes('/company/')) {
    navigate(lastCompanyRoute);
  } else if (targetCompany) {
    navigate(`/app/company/${encodeURIComponent(targetCompany)}`);
  } else {
    navigate('/app/clients');
  }
}
```
