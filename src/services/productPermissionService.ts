import { supabase } from '@/integrations/supabase/client';
import type { ProductUserAccess } from '@/types/productUserAccess';

/**
 * Service for server-side product permission checks
 * Use this in async operations before making changes to the database
 */
export class ProductPermissionService {
  /**
   * Check if a user has permission to perform an action on a product
   */
  static async checkPermission(
    userId: string,
    productId: string,
    permissionKey: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('product_user_access')
        .select('permissions, is_active')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return false;

      return data.permissions[permissionKey] === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if a user has required access level for a product
   */
  static async checkAccessLevel(
    userId: string,
    productId: string,
    requiredLevel: 'read' | 'write' | 'full'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('product_user_access')
        .select('access_level, is_active')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return false;

      const levels = { 'none': 0, 'read': 1, 'write': 2, 'full': 3 };
      const userLevel = levels[data.access_level] || 0;
      const required = levels[requiredLevel] || 0;

      return userLevel >= required;
    } catch (error) {
      console.error('Error checking access level:', error);
      return false;
    }
  }

  /**
   * Get user's full access record for a product
   */
  static async getUserAccess(
    userId: string,
    productId: string
  ): Promise<ProductUserAccess | null> {
    try {
      const { data, error } = await supabase
        .from('product_user_access')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as ProductUserAccess | null;
    } catch (error) {
      console.error('Error fetching user access:', error);
      return null;
    }
  }

  /**
   * Enforce permission before allowing an operation
   * Throws error if permission is denied
   */
  static async enforcePermission(
    userId: string,
    productId: string,
    permissionKey: string,
    errorMessage?: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, productId, permissionKey);
    
    if (!hasPermission) {
      throw new Error(
        errorMessage || `Permission denied: ${permissionKey} for product ${productId}`
      );
    }
  }

  /**
   * Enforce access level before allowing an operation
   * Throws error if access level is insufficient
   */
  static async enforceAccessLevel(
    userId: string,
    productId: string,
    requiredLevel: 'read' | 'write' | 'full',
    errorMessage?: string
  ): Promise<void> {
    const hasAccess = await this.checkAccessLevel(userId, productId, requiredLevel);
    
    if (!hasAccess) {
      throw new Error(
        errorMessage || `Insufficient access level: ${requiredLevel} required for product ${productId}`
      );
    }
  }
}
