/**
 * useDeviceMenuPreference Hook
 *
 * React hook for managing device menu preferences in localStorage.
 * Automatically loads and saves preferences with user and company isolation.
 *
 * Usage:
 * const { preference, updatePreference, clearPreference } = useDeviceMenuPreference(companyId, deviceId);
 */

import { useState, useEffect, useCallback } from "react";
// import { useAuth } from "@/hooks/useAuth";
import {
  DeviceMenuPreference,
  getDeviceMenuPreference,
  setDeviceMenuPreference,
  removeDeviceMenuPreference,
} from "@/services/devicePreferenceService";
import { useAuth } from "@/context/AuthContext";

interface UseDeviceMenuPreferenceReturn {
  /** Current saved preference (null if none) */
  preference: DeviceMenuPreference | null;

  /** Loading state */
  isLoading: boolean;

  /** Update preference (partial updates supported) */
  updatePreference: (updates: Partial<Omit<DeviceMenuPreference, "lastVisited">>) => void;

  /** Clear the preference */
  clearPreference: () => void;

  /** Whether a preference exists */
  hasPreference: boolean;
}

/**
 * Hook for managing device menu preferences
 *
 * @param companyId - Current company ID
 * @param deviceId - Current device ID
 * @returns Preference state and update functions
 */
export function useDeviceMenuPreference(
  companyId: string | null,
  deviceId: string | null
): UseDeviceMenuPreferenceReturn {
  const { user } = useAuth();
  const [preference, setPreference] = useState<DeviceMenuPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preference when device, company, or user changes
  useEffect(() => {
    if (!deviceId || !companyId || !user?.id) {
      setPreference(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Read from localStorage
    const savedPreference = getDeviceMenuPreference(user.id, companyId, deviceId);
    setPreference(savedPreference);
    setIsLoading(false);

    if (savedPreference) {
      console.log("[useDeviceMenuPreference] Loaded preference:", savedPreference);
    }
  }, [deviceId, companyId, user?.id]);

  // Update preference
  const updatePreference = useCallback(
    (updates: Partial<Omit<DeviceMenuPreference, "lastVisited">>) => {
      if (!deviceId || !companyId || !user?.id) {
        console.warn("[useDeviceMenuPreference] Cannot update: missing deviceId, companyId, or user");
        return;
      }

      const newPreference: Omit<DeviceMenuPreference, "lastVisited"> = {
        selectedSection: preference?.selectedSection || "",
        selectedMenuId: preference?.selectedMenuId || "",
        selectedSubMenuId: preference?.selectedSubMenuId,
        selectedTab: preference?.selectedTab,
        ...updates,
      };

      // Save to localStorage
      const success = setDeviceMenuPreference(user.id, companyId, deviceId, newPreference);

      if (success) {
        // Update local state
        setPreference({
          ...newPreference,
          lastVisited: new Date().toISOString(),
        });
      }
    },
    [deviceId, companyId, user?.id, preference]
  );

  // Clear preference
  const clearPreference = useCallback(() => {
    if (!deviceId || !companyId || !user?.id) {
      return;
    }

    removeDeviceMenuPreference(user.id, companyId, deviceId);
    setPreference(null);
    console.log("[useDeviceMenuPreference] Cleared preference");
  }, [deviceId, companyId, user?.id]);

  return {
    preference,
    isLoading,
    updatePreference,
    clearPreference,
    hasPreference: preference !== null,
  };
}

export default useDeviceMenuPreference;
