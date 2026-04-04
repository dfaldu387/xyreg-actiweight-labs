import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { UserRole } from '@/types/documentTypes';
import { hasAdminPrivileges } from '@/utils/roleUtils';

/**
 * Hook to get the effective user role for the current company context.
 * Uses cached data from CompanyRoleContext to avoid duplicate API calls.
 */
export function useEffectiveUserRole() {
  const { user, userRole: authUserRole } = useAuth();
  const { activeCompanyRole, companyRoles, isLoading: companyRolesLoading } = useCompanyRole();
  const [effectiveRole, setEffectiveRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine effective role from cached data (no API calls needed)
  useEffect(() => {
    if (!user) {
      setEffectiveRole(null);
      setIsLoading(false);
      return;
    }

    // Special case for super admin users
    if (user.user_metadata?.role === 'super_admin') {
      setEffectiveRole('super_admin' as UserRole);
      setIsLoading(false);
      return;
    }

    // If company roles are still loading, wait
    if (companyRolesLoading) {
      return;
    }

    // If the auth user role is admin, prioritize it (for new invited admin users)
    if (authUserRole === 'admin') {
      setEffectiveRole(authUserRole);
      setIsLoading(false);
      return;
    }

    // If we have an active company role, use that
    if (activeCompanyRole) {
      setEffectiveRole(activeCompanyRole.role);
      setIsLoading(false);
      return;
    }

    // If we have company roles but no active one, try to get the primary or first one
    if (companyRoles.length > 0) {
      const primaryRole = companyRoles.find(role => role.isPrimary) || companyRoles[0];
      setEffectiveRole(primaryRole.role);
      setIsLoading(false);
      return;
    }

    // Fallback to auth user role if no company roles available
    setEffectiveRole(authUserRole);
    setIsLoading(false);
  }, [user, authUserRole, activeCompanyRole, companyRoles, companyRolesLoading]);

  // Memoize the result to prevent unnecessary re-renders
  const result = useMemo(() => ({
    effectiveRole: effectiveRole || authUserRole,
    isLoading,
    isAdmin: hasAdminPrivileges(effectiveRole || authUserRole),
    authUserRole,
    activeCompanyRole,
    companyRoles
  }), [effectiveRole, isLoading, authUserRole, activeCompanyRole, companyRoles]);

  return result;
}
