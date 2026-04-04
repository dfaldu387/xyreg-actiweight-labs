import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { PermissionChecker, createPermissionContext } from '@/utils/permissionUtils';

/**
 * Hook for checking user permissions that works with both real auth and DevMode
 */
export function usePermissions() {
  const { user, userRole, isLoading } = useAuth();
  const { isDevMode } = useDevMode();
  
  // Create permission context
  const context = useMemo(() => 
    createPermissionContext(user, userRole, isDevMode, isLoading),
    [user, userRole, isDevMode, isLoading]
  );
  
  // Memoize permission checks for performance
  const permissions = useMemo(() => ({
    isAuthenticated: PermissionChecker.isAuthenticated(context),
    hasAdminAccess: PermissionChecker.hasAdminAccess(context),
    hasEditorAccess: PermissionChecker.hasEditorAccess(context),
    canArchiveProduct: PermissionChecker.canArchiveProduct(context),
    canManageCompany: PermissionChecker.canManageCompany(context),
    
    // Debug helper
    debug: (action: string) => PermissionChecker.debugPermissions(context, action),
  }), [context]);
  
  return {
    ...permissions,
    context,
    // Raw values for debugging
    user,
    userRole,
    isDevMode,
    isLoading,
  };
}