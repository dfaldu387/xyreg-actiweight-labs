import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { ProductUserAccess } from '@/types/productUserAccess';

/**
 * Hook to check if the current user has specific permissions for a product
 * 
 * Permissions are product-specific - a user can have different permissions
 * for different products. Each product maintains independent access control.
 * 
 * @param productId - The ID of the product to check permissions for
 * @returns Object with permission checking functions and access information
 */
export function useProductPermissions(productId: string | undefined) {
  const { user } = useAuth();
  const [access, setAccess] = useState<ProductUserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !user) {
      setIsLoading(false);
      return;
    }

    const fetchUserAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('product_user_access')
          .select('*')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setAccess(data as ProductUserAccess);
      } catch (err) {
        console.error('Error fetching product permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAccess();
  }, [productId, user]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permissionKey: string): boolean => {
    if (!access || !access.is_active) return false;
    return access.permissions[permissionKey] === true;
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some(key => hasPermission(key));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every(key => hasPermission(key));
  };

  /**
   * Check if user has at least the specified access level
   */
  const hasAccessLevel = (requiredLevel: 'read' | 'write' | 'full'): boolean => {
    if (!access || !access.is_active) return false;

    const levels = { 'none': 0, 'read': 1, 'write': 2, 'full': 3 };
    const userLevel = levels[access.access_level] || 0;
    const required = levels[requiredLevel] || 0;

    return userLevel >= required;
  };

  /**
   * Check if user can read/view the product
   */
  const canView = (): boolean => {
    return hasAccessLevel('read');
  };

  /**
   * Check if user can edit/modify the product
   */
  const canEdit = (): boolean => {
    return hasAccessLevel('write');
  };

  /**
   * Check if user has full control over the product
   */
  const hasFullAccess = (): boolean => {
    return hasAccessLevel('full');
  };

  /**
   * Specific permission checks for common operations
   */
  const permissions = {
    // Product operations
    canDeleteProduct: hasPermission('product_delete'),
    canEditProduct: hasPermission('product_edit'),
    canViewProduct: hasPermission('product_view'),
    
    // Document operations
    canCreateDocument: hasPermission('document_create'),
    canEditDocument: hasPermission('document_edit'),
    canDeleteDocument: hasPermission('document_delete'),
    canViewDocument: hasPermission('document_view'),
    
    // Variant operations
    canCreateVariant: hasPermission('variant_create'),
    canEditVariant: hasPermission('variant_edit'),
    canDeleteVariant: hasPermission('variant_delete'),
    
    // Market operations
    canEditMarkets: hasPermission('markets_edit'),
    canViewMarkets: hasPermission('markets_view'),
    
    // Feasibility operations
    canEditFeasibility: hasPermission('feasibility_edit'),
    canViewFeasibility: hasPermission('feasibility_view'),
    
    // User management
    canManageUsers: hasPermission('users_manage'),
    
    // Settings
    canEditSettings: hasPermission('settings_edit'),
  };

  return {
    access,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasAccessLevel,
    canView,
    canEdit,
    hasFullAccess,
    ...permissions,
    // Expose raw access data for custom checks
    userType: access?.user_type,
    accessLevel: access?.access_level,
    isActive: access?.is_active ?? false,
  };
}
