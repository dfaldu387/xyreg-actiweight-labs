import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { UserCompanyModuleAccessService } from '@/services/userCompanyModuleAccessService';
import { useCompanyRole } from '@/context/CompanyRoleContext';

interface UseUserModuleAccessReturn {
  allowedModuleIds: string[] | null; // null means all modules allowed, array means restricted
  isLoading: boolean;
  hasAccess: (moduleId: string) => boolean;
}

/**
 * Hook to fetch and manage user module access for the current company
 * Uses React Query for caching to prevent duplicate API calls across components
 * Returns null for allowedModuleIds if user has access to all modules (no restrictions)
 * Returns array of module IDs if user has restricted access
 */
export function useUserModuleAccess(): UseUserModuleAccessReturn {
  const { user } = useAuth();
  const { activeCompanyRole, isLoading: companyRolesLoading } = useCompanyRole();

  // Get company ID from active company role (cached in context)
  const companyId = activeCompanyRole?.companyId || null;

  // Use React Query for caching module access data
  const { data: allowedModuleIds, isLoading: isQueryLoading } = useQuery({
    queryKey: ['user-module-access', user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) {
        return null; // No restrictions
      }

      const moduleAccess = await UserCompanyModuleAccessService.getUserModuleAccess(
        user.id,
        companyId
      );

      // If no module access record exists or is inactive, user has access to all modules
      if (!moduleAccess || !moduleAccess.is_active) {
        return null;
      }

      // If module_ids is empty array, user has no access to any modules
      if (!moduleAccess.module_ids || moduleAccess.module_ids.length === 0) {
        return [];
      }

      // User has restricted access to specific modules
      return moduleAccess.module_ids;
    },
    enabled: !!user?.id && !companyRolesLoading,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const isLoading = companyRolesLoading || isQueryLoading;

  /**
   * Check if user has access to a specific module
   * Returns true if:
   * - allowedModuleIds is null or undefined (no restrictions or still loading)
   * - allowedModuleIds contains the moduleId
   * Returns false if:
   * - allowedModuleIds is empty array (no access)
   * - allowedModuleIds doesn't contain the moduleId
   *
   * Memoized to prevent unnecessary re-renders
   */
  const hasAccess = useMemo(() => {
    return (moduleId: string): boolean => {
      // If no restrictions (null/undefined), user has access to all modules
      // This also handles the loading state gracefully
      if (allowedModuleIds === null || allowedModuleIds === undefined) {
        return true;
      }

      // If empty array, user has no access
      if (allowedModuleIds.length === 0) {
        return false;
      }

      // Check if user has access to this specific module
      return allowedModuleIds.includes(moduleId);
    };
  }, [allowedModuleIds]);

  return {
    allowedModuleIds: allowedModuleIds ?? null,
    isLoading,
    hasAccess,
  };
}

