import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { PermissionLevel, UserRole } from "@/types/documentTypes";
import { roleToPermissionLevel, hasRequiredPermissionLevel, getEffectiveRole } from "@/services/permissionUtils";
import { useDevMode } from "@/context/DevModeContext";
import { toast } from "sonner";

export type PermissionTarget = 'company' | 'product' | 'document';

export interface PermissionCheckResult {
  loading: boolean;
  hasPermission: boolean;
  permissionLevel: PermissionLevel | null;
  isOverride: boolean;
  isReviewer?: boolean;
  reviewerType?: 'internal' | 'external' | 'none';
}

/**
 * Optimized hook to check user permissions for various entities
 */
export const useEfficientPermission = (
  targetType: PermissionTarget,
  targetId?: string,
  requiredLevel: PermissionLevel = "V"
): PermissionCheckResult => {
  const { user, userRole } = useAuth();
  const { activeRole, activeCompanyId } = useCompanyRole();
  const { isDevMode, getCompanyRole } = useDevMode();
  
  const [loading, setLoading] = useState(true);
  const [permissionData, setPermissionData] = useState<{
    level: PermissionLevel | null;
    override: boolean;
    isReviewer: boolean;
    reviewerType: 'internal' | 'external' | 'none';
  }>({
    level: null,
    override: false,
    isReviewer: false,
    reviewerType: 'none'
  });

  // Get the effective role based on DevMode settings if applicable
  const effectiveCompanyRole = useMemo(() => {
    if (isDevMode && process.env.NODE_ENV !== 'production') {
      // For company target, use the company ID directly
      if (targetType === 'company' && targetId) {
        return getCompanyRole(targetId);
      }
      
      // For other target types, use the active company ID if available
      if (activeCompanyId) {
        return getCompanyRole(activeCompanyId);
      }
    }
    
    return activeRole;
  }, [isDevMode, activeRole, activeCompanyId, targetType, targetId, getCompanyRole]);
  
  // Memoize the default permission level based on active company role
  const defaultPermLevel = useMemo(() => {
    // First try to use the company-specific role if available
    if (effectiveCompanyRole) {
      return roleToPermissionLevel(effectiveCompanyRole);
    }
    
    // Fall back to the global user role
    return userRole ? roleToPermissionLevel(userRole) : null;
  }, [userRole, effectiveCompanyRole]);
  
  // Determine if the user has the required permission level
  const hasPermission = useMemo(() => {
    const level = permissionData.level || defaultPermLevel;
    return !!level && hasRequiredPermissionLevel(level, requiredLevel);
  }, [permissionData.level, defaultPermLevel, requiredLevel]);
  
  // Fetch permissions when dependencies change
  useEffect(() => {
    // If no user or target ID, use default permissions
    if (!user?.id || !targetId) {
      setPermissionData({
        level: defaultPermLevel,
        override: false,
        isReviewer: false,
        reviewerType: 'none'
      });
      setLoading(false);
      return;
    }
    
    // Otherwise fetch specific permissions
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        let result = {
          level: defaultPermLevel,
          override: false,
          isReviewer: false,
          reviewerType: 'none' as 'internal' | 'external' | 'none'
        };
        
        // In DevMode, skip real permission checks and use the DevMode roles directly
        if (isDevMode && process.env.NODE_ENV !== 'production') {
          setPermissionData({
            level: defaultPermLevel,
            override: true,  // Mark as override to indicate we're using DevMode
            isReviewer: false,
            reviewerType: 'none'
          });
          setLoading(false);
          return;
        }
        
        // Regular permission checks if not in DevMode
        // Check permissions based on target type
        if (targetType === 'company') {
          const companyPermissions = await fetchCompanyPermissions(user.id, targetId);
          if (companyPermissions) {
            result.level = companyPermissions.level;
          }
        } 
        else if (targetType === 'product') {
          const productPermissions = await fetchProductPermissions(user.id, targetId);
          if (productPermissions) {
            result = { ...result, ...productPermissions };
          }
        }
        else if (targetType === 'document') {
          const documentPermissions = await fetchDocumentPermissions(user.id, targetId);
          if (documentPermissions) {
            result = { ...result, ...documentPermissions };
          }
        }
        
        setPermissionData(result);
      } catch (error) {
        console.error(`Error checking ${targetType} permission:`, error);
        toast.error(`Failed to check permissions for ${targetType}`);
        // Fall back to default permissions on error
        setPermissionData({
          level: defaultPermLevel,
          override: false,
          isReviewer: false,
          reviewerType: 'none'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [user?.id, targetId, targetType, defaultPermLevel, requiredLevel, activeCompanyId, effectiveCompanyRole, isDevMode]);
  
  return { 
    loading, 
    hasPermission, 
    permissionLevel: permissionData.level, 
    isOverride: permissionData.override,
    isReviewer: permissionData.isReviewer,
    reviewerType: permissionData.reviewerType
  };
};

// Helper functions to fetch specific permission types
async function fetchCompanyPermissions(userId: string, companyId: string) {
  const { data } = await supabase
    .from('user_company_access')
    .select('access_level')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();
    
  if (!data) return null;
  
  // Map access_level to PermissionLevel
  const accessToPermission: Record<string, PermissionLevel> = {
    'admin': 'A',
    'editor': 'E',
    'viewer': 'V'
  };
  
  return {
    level: accessToPermission[data.access_level] || null
  };
}

async function fetchProductPermissions(userId: string, productId: string) {
  // Check product-specific permissions
  const { data: productData } = await supabase
    .from('user_product_permissions')
    .select('permissions, override_company_permissions')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
    
  if (!productData) return null;
  
  let level: PermissionLevel | null = null;
  
  if (productData.permissions.includes('A')) {
    level = 'A';
  } else if (productData.permissions.includes('E')) {
    level = 'E';
  } else if (productData.permissions.includes('V')) {
    level = 'V';
  }
  
  return {
    level,
    override: productData.override_company_permissions
  };
}

async function fetchDocumentPermissions(userId: string, documentId: string) {
  // Check if user has access to this document via document_ids array
  const { data: documentData } = await supabase
    .from('user_document_permissions')
    .select(`
      permissions, 
      override_product_permissions, 
      is_internal_reviewer,
      is_external_reviewer,
      is_active_reviewer
    `)
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .maybeSingle() as { data: any };
    
  
  if (!documentData) return null;
  
  let level: PermissionLevel | null = null;
  
  if (documentData.permissions.includes('A')) {
    level = 'A';
  } else if (documentData.permissions.includes('E')) {
    level = 'E';
  } else if (documentData.permissions.includes('V')) {
    level = 'V';
  }
  
  // Determine reviewer status
  const isReviewer = documentData.is_active_reviewer;
  let reviewerType: 'internal' | 'external' | 'none' = 'none';
  
  if (isReviewer) {
    if (documentData.is_internal_reviewer) {
      reviewerType = 'internal';
    } else if (documentData.is_external_reviewer) {
      reviewerType = 'external';
    }
  }
  
  return {
    level: 'V' as PermissionLevel,
    override: false,
    isReviewer: false,
    reviewerType: 'none' as const
  };
}
