/**
 * Device Preference Service
 *
 * Handles localStorage operations for device and company menu preferences.
 *
 * SECURITY FEATURES:
 * - All keys include userId for complete user isolation
 * - All keys include companyId for company-level isolation
 * - Preferences are cleared on logout
 * - 30-day auto-expiry for stale preferences
 *
 * KEY PATTERN: xyreg_user_{userId}_company_{companyId}_device_{deviceId}_menu_preference
 */

const APP_PREFIX = "xyreg";

// Preference types
export type PreferenceType = "menu_preference" | "view_preference" | "filter_preference";

/**
 * Device menu preference structure
 */
export interface DeviceMenuPreference {
  // Main section selected (e.g., 'company', 'product', 'phases')
  selectedSection: string;

  // Selected menu within the section
  selectedMenuId: string;

  // Optional: Selected sub-menu if applicable
  selectedSubMenuId?: string;

  // Optional: Selected tab within the menu
  selectedTab?: string;

  // Timestamp of last visit (for expiry check)
  lastVisited: string;
}

/**
 * Company menu preference structure (for company-level document menus)
 */
export interface CompanyMenuPreference {
  // Selected menu/tab in company documents section
  selectedMenuId: string;

  // Optional: Selected sub-menu
  selectedSubMenuId?: string;

  // Optional: Selected view type (list/grid)
  viewType?: string;

  // Timestamp of last visit
  lastVisited: string;
}

// ============================================================================
// KEY GENERATION - CRITICAL FOR USER ISOLATION
// ============================================================================

/**
 * Generate localStorage key for device menu preference
 * SECURITY: Always includes userId and companyId for isolation
 */
function getDeviceMenuKey(userId: string, companyId: string, deviceId: string): string {
  if (!userId || !companyId || !deviceId) {
    throw new Error("userId, companyId, and deviceId are required");
  }
  return `${APP_PREFIX}_user_${userId}_company_${companyId}_device_${deviceId}_menu_preference`;
}

/**
 * Generate localStorage key for company menu preference
 * SECURITY: Always includes userId and companyId for isolation
 */
function getCompanyMenuKey(userId: string, companyId: string): string {
  if (!userId || !companyId) {
    throw new Error("userId and companyId are required");
  }
  return `${APP_PREFIX}_user_${userId}_company_${companyId}_company_menu_preference`;
}

// ============================================================================
// EXPIRY CHECK
// ============================================================================

const EXPIRY_DAYS = 30;

/**
 * Check if a preference has expired
 */
function isExpired(lastVisited: string): boolean {
  const lastVisitedDate = new Date(lastVisited);
  const daysSinceVisit = (Date.now() - lastVisitedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceVisit > EXPIRY_DAYS;
}

// ============================================================================
// DEVICE MENU PREFERENCE OPERATIONS
// ============================================================================

/**
 * Get device menu preference
 */
export function getDeviceMenuPreference(
  userId: string,
  companyId: string,
  deviceId: string
): DeviceMenuPreference | null {
  if (!userId || !companyId || !deviceId) {
    console.warn("[DevicePreferenceService] Missing userId, companyId, or deviceId");
    return null;
  }

  try {
    const key = getDeviceMenuKey(userId, companyId, deviceId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const preference = JSON.parse(stored) as DeviceMenuPreference;

    // Check if preference is expired
    if (isExpired(preference.lastVisited)) {
      
      localStorage.removeItem(key);
      return null;
    }

    return preference;
  } catch (error) {
    console.error("[DevicePreferenceService] Error reading device preference:", error);
    return null;
  }
}

/**
 * Save device menu preference
 */
export function setDeviceMenuPreference(
  userId: string,
  companyId: string,
  deviceId: string,
  preference: Omit<DeviceMenuPreference, "lastVisited">
): boolean {
  if (!userId || !companyId || !deviceId) {
    console.warn("[DevicePreferenceService] Missing userId, companyId, or deviceId");
    return false;
  }

  try {
    const key = getDeviceMenuKey(userId, companyId, deviceId);
    const data: DeviceMenuPreference = {
      ...preference,
      lastVisited: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.error("[DevicePreferenceService] Error saving device preference:", error);
    return false;
  }
}

/**
 * Remove device menu preference
 */
export function removeDeviceMenuPreference(
  userId: string,
  companyId: string,
  deviceId: string
): boolean {
  if (!userId || !companyId || !deviceId) {
    return false;
  }

  try {
    const key = getDeviceMenuKey(userId, companyId, deviceId);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("[DevicePreferenceService] Error removing device preference:", error);
    return false;
  }
}

// ============================================================================
// COMPANY MENU PREFERENCE OPERATIONS
// ============================================================================

/**
 * Get company menu preference
 */
export function getCompanyMenuPreference(
  userId: string,
  companyId: string
): CompanyMenuPreference | null {
  if (!userId || !companyId) {
    console.warn("[DevicePreferenceService] Missing userId or companyId");
    return null;
  }

  try {
    const key = getCompanyMenuKey(userId, companyId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const preference = JSON.parse(stored) as CompanyMenuPreference;

    // Check if preference is expired
    if (isExpired(preference.lastVisited)) {
      
      localStorage.removeItem(key);
      return null;
    }

    return preference;
  } catch (error) {
    console.error("[DevicePreferenceService] Error reading company preference:", error);
    return null;
  }
}

/**
 * Save company menu preference
 */
export function setCompanyMenuPreference(
  userId: string,
  companyId: string,
  preference: Omit<CompanyMenuPreference, "lastVisited">
): boolean {
  if (!userId || !companyId) {
    console.warn("[DevicePreferenceService] Missing userId or companyId");
    return false;
  }

  try {
    const key = getCompanyMenuKey(userId, companyId);
    const data: CompanyMenuPreference = {
      ...preference,
      lastVisited: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.error("[DevicePreferenceService] Error saving company preference:", error);
    return false;
  }
}

/**
 * Remove company menu preference
 */
export function removeCompanyMenuPreference(
  userId: string,
  companyId: string
): boolean {
  if (!userId || !companyId) {
    return false;
  }

  try {
    const key = getCompanyMenuKey(userId, companyId);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("[DevicePreferenceService] Error removing company preference:", error);
    return false;
  }
}

// ============================================================================
// CLEANUP OPERATIONS - CRITICAL FOR LOGOUT
// ============================================================================

/**
 * Clear ALL preferences for a user (MUST be called on logout)
 * This ensures no data leaks to other users
 */
export function clearAllUserPreferences(userId: string): void {
  if (!userId) {
    console.warn("[DevicePreferenceService] Cannot clear preferences: no userId");
    return;
  }

  const keysToRemove: string[] = [];

  // Pattern 1: xyreg_user_{userId}_ prefix (device/company menu preferences)
  const xyregPrefix = `${APP_PREFIX}_user_${userId}_`;

  // Pattern 2: L1/L2 memory keys (lastSelectedProduct, lastSelectedProductRoute, lastSelectedCompanyRoute)
  const l1l2Patterns = [
    `lastSelectedProduct_${userId}`,
    `lastSelectedProductRoute_${userId}`,
    `lastSelectedCompanyRoute_${userId}`,
  ];

  // Find all keys for this user
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Check xyreg prefix
      if (key.startsWith(xyregPrefix)) {
        keysToRemove.push(key);
      }
      // Check L1/L2 patterns (these keys are like lastSelectedProduct_{userId}_{companyId})
      else if (l1l2Patterns.some(pattern => key.startsWith(pattern))) {
        keysToRemove.push(key);
      }
    }
  }

  // Also remove non-user-specific keys that should be cleared on logout
  const globalKeysToRemove = [
    'lastSelectedCompany',
    'recentProducts',
  ];

  globalKeysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      keysToRemove.push(key);
    }
  });

  // Remove all found keys
  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  
}

/**
 * Clear all preferences for a specific company (useful when user leaves a company)
 */
export function clearCompanyPreferences(userId: string, companyId: string): void {
  if (!userId || !companyId) {
    return;
  }

  const prefix = `${APP_PREFIX}_user_${userId}_company_${companyId}_`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  
}

// ============================================================================
// DEBUG / ADMIN UTILITIES
// ============================================================================

/**
 * Get all preferences for a user (for debugging)
 */
export function getAllUserPreferences(userId: string): Record<string, unknown> {
  const prefix = `${APP_PREFIX}_user_${userId}_`;
  const preferences: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          preferences[key] = JSON.parse(value);
        }
      } catch {
        // Skip invalid entries
      }
    }
  }

  return preferences;
}

/**
 * Get count of preferences for a user
 */
export function getUserPreferenceCount(userId: string): number {
  const prefix = `${APP_PREFIX}_user_${userId}_`;
  let count = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      count++;
    }
  }

  return count;
}
