import { UserRole } from '@/types/documentTypes';
import { AuthUser } from '@/services/authService';
import { hasAdminPrivileges, hasEditorPrivileges } from './roleUtils';

export interface PermissionContext {
  user: AuthUser | null;
  userRole: UserRole;
  isDevMode: boolean;
  isLoading: boolean;
}

/**
 * Comprehensive permission checking utility that works with both real auth and DevMode
 */
export class PermissionChecker {
  /**
   * Check if user is authenticated (works with both real auth and DevMode)
   */
  static isAuthenticated(context: PermissionContext): boolean {
    const { user, isDevMode, isLoading } = context;
    
    // Don't show permissions while loading
    if (isLoading) {
      return false;
    }
    
    // In DevMode, check for mock user
    if (isDevMode) {
      return user !== null && user.id !== '';
    }
    
    // For real auth, check for actual user - simplified check
    // The main AuthContext and ProtectedRoute already handle session validation
    return user !== null && user.id !== '';
  }
  
  /**
   * Check if user has admin privileges
   */
  static hasAdminAccess(context: PermissionContext): boolean {
    const { userRole } = context;
    
    if (!this.isAuthenticated(context)) {
      return false;
    }
    
    return hasAdminPrivileges(userRole);
  }
  
  /**
   * Check if user has editor privileges
   */
  static hasEditorAccess(context: PermissionContext): boolean {
    const { userRole } = context;
    
    if (!this.isAuthenticated(context)) {
      return false;
    }
    
    return hasEditorPrivileges(userRole);
  }
  
  /**
   * Check if user can archive products
   */
  static canArchiveProduct(context: PermissionContext): boolean {
    // For now, allow any authenticated user to archive
    // Archive dialog will handle the actual permission checking
    return this.isAuthenticated(context);
  }
  
  /**
   * Check if user can manage company settings
   */
  static canManageCompany(context: PermissionContext): boolean {
    return this.hasAdminAccess(context);
  }
  
  /**
   * Debug helper to log permission context
   */
  static debugPermissions(context: PermissionContext, action: string): void {
    const { user, userRole, isDevMode, isLoading } = context;
    
    // console.log(`[Permission Check] ${action}:`, {
    //   isAuthenticated: this.isAuthenticated(context),
    //   userId: user?.id || 'null',
    //   userEmail: user?.email || 'null',
    //   userRole,
    //   isDevMode,
    //   isLoading,
    //   hasAdmin: this.hasAdminAccess(context),
    //   hasEditor: this.hasEditorAccess(context),
    // });
  }
}

/**
 * Hook-friendly helper function
 */
export function createPermissionContext(
  user: AuthUser | null,
  userRole: UserRole,
  isDevMode: boolean,
  isLoading: boolean
): PermissionContext {
  return {
    user,
    userRole,
    isDevMode,
    isLoading
  };
}