/**
 * useCompanyMenuPreference Hook
 *
 * React hook for managing company-level menu preferences in localStorage.
 * Automatically loads and saves preferences with user isolation.
 *
 * Usage:
 * const { preference, updatePreference, clearPreference } = useCompanyMenuPreference(companyId);
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  CompanyMenuPreference,
  getCompanyMenuPreference,
  setCompanyMenuPreference,
  removeCompanyMenuPreference,
} from "@/services/devicePreferenceService";

interface UseCompanyMenuPreferenceReturn {
  /** Current saved preference (null if none) */
  preference: CompanyMenuPreference | null;

  /** Loading state */
  isLoading: boolean;

  /** Update preference (partial updates supported) */
  updatePreference: (updates: Partial<Omit<CompanyMenuPreference, "lastVisited">>) => void;

  /** Clear the preference */
  clearPreference: () => void;

  /** Whether a preference exists */
  hasPreference: boolean;
}

/**
 * Hook for managing company menu preferences
 *
 * @param companyId - Current company ID
 * @returns Preference state and update functions
 */
export function useCompanyMenuPreference(
  companyId: string | null
): UseCompanyMenuPreferenceReturn {
  const { user } = useAuth();
  const [preference, setPreference] = useState<CompanyMenuPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preference when company or user changes
  useEffect(() => {
    if (!companyId || !user?.id) {
      setPreference(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Read from localStorage
    const savedPreference = getCompanyMenuPreference(user.id, companyId);
    setPreference(savedPreference);
    setIsLoading(false);

    if (savedPreference) {
      console.log("[useCompanyMenuPreference] Loaded preference:", savedPreference);
    }
  }, [companyId, user?.id]);

  // Update preference
  const updatePreference = useCallback(
    (updates: Partial<Omit<CompanyMenuPreference, "lastVisited">>) => {
      if (!companyId || !user?.id) {
        console.warn("[useCompanyMenuPreference] Cannot update: missing companyId or user");
        return;
      }

      const newPreference: Omit<CompanyMenuPreference, "lastVisited"> = {
        selectedMenuId: preference?.selectedMenuId || "",
        selectedSubMenuId: preference?.selectedSubMenuId,
        viewType: preference?.viewType,
        ...updates,
      };

      // Save to localStorage
      const success = setCompanyMenuPreference(user.id, companyId, newPreference);

      if (success) {
        // Update local state
        setPreference({
          ...newPreference,
          lastVisited: new Date().toISOString(),
        });
      }
    },
    [companyId, user?.id, preference]
  );

  // Clear preference
  const clearPreference = useCallback(() => {
    if (!companyId || !user?.id) {
      return;
    }

    removeCompanyMenuPreference(user.id, companyId);
    setPreference(null);
    console.log("[useCompanyMenuPreference] Cleared preference");
  }, [companyId, user?.id]);

  return {
    preference,
    isLoading,
    updatePreference,
    clearPreference,
    hasPreference: preference !== null,
  };
}

export default useCompanyMenuPreference;
