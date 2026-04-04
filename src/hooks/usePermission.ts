
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PermissionLevel, UserRole } from "@/types/documentTypes";
import { useDevMode } from "@/context/DevModeContext";
import { getEffectiveRole } from "@/services/permissionUtils";

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
 * Convert role to permission level
 */
const roleToPermissionLevel = (role: UserRole): PermissionLevel => {
  switch (role) {
    case "admin": return "A";
    case "editor": return "E";
    case "viewer": return "V";
    case "consultant": return "A"; // Consultant has admin-level permissions
    default: return "V";
  }
};

/**
 * Check if permission level meets requirement
 */
const hasRequiredPermissionLevel = (
  userLevel: PermissionLevel, 
  requiredLevel: PermissionLevel
): boolean => {
  if (userLevel === 'A') return true;
  if (userLevel === 'E' && requiredLevel !== 'A') return true;
  return userLevel === 'V' && requiredLevel === 'V';
};

/**
 * Hook to check user permissions for various entities
 */
export const usePermission = (
  targetType: PermissionTarget,
  targetId?: string,
  requiredLevel: PermissionLevel = "V"
): PermissionCheckResult => {
  const { user, userRole } = useAuth();
  const { isDevMode } = useDevMode();
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);
  const [reviewerType, setReviewerType] = useState<'internal' | 'external' | 'none'>('none');
  
  useEffect(() => {
    // In DevMode, bypass database checks and use effective role
    if (isDevMode && process.env.NODE_ENV !== 'production') {
      const effectiveRole = getEffectiveRole(userRole, targetId);
      const defaultPermLevel = roleToPermissionLevel(effectiveRole);
      
      setPermissionLevel(defaultPermLevel);
      setHasPermission(hasRequiredPermissionLevel(defaultPermLevel, requiredLevel));
      setIsOverride(true); // Mark as override to indicate DevMode
      setIsReviewer(false);
      setReviewerType('none');
      setLoading(false);
      return;
    }
    
    // Default permission level based on user role, can be overridden by specific checks
    const defaultPermLevel = userRole ? roleToPermissionLevel(userRole) : null;
    
    if (!user?.id || !targetId) {
      setPermissionLevel(defaultPermLevel);
      setHasPermission(!!defaultPermLevel && hasRequiredPermissionLevel(defaultPermLevel, requiredLevel));
      setLoading(false);
      return;
    }
    
    const checkPermission = async () => {
      try {
        setLoading(true);
        let resultLevel: PermissionLevel | null = defaultPermLevel;
        let override = false;
        let reviewer = false;
        let revType: 'internal' | 'external' | 'none' = 'none';
        
        // Check permissions based on target type
        if (targetType === 'company') {
          const { data } = await supabase
            .from('user_company_access')
            .select('access_level')
            .eq('user_id', user.id)
            .eq('company_id', targetId)
            .single();
            
          if (data) {
            // Map access_level to PermissionLevel
            const accessToPermission: Record<string, PermissionLevel> = {
              'admin': 'A',
              'editor': 'E',
              'viewer': 'V',
              'consultant': 'A' // Consultant has admin-level permissions
            };
            resultLevel = accessToPermission[data.access_level] || null;
          }
        } 
        else if (targetType === 'product') {
          // First check product-specific permissions
          const { data: productData } = await supabase
            .from('user_product_permissions')
            .select('permissions, override_company_permissions')
            .eq('user_id', user.id)
            .eq('product_id', targetId)
            .single();
            
          if (productData) {
            override = productData.override_company_permissions;
            
            if (productData.permissions.includes('A')) {
              resultLevel = 'A';
            } else if (productData.permissions.includes('E')) {
              resultLevel = 'E';
            } else if (productData.permissions.includes('V')) {
              resultLevel = 'V';
            }
          }
          
          // If no product-specific permissions or not overriding, check company permissions
          if (!productData || !override) {
            const { data: productInfo } = await supabase
              .from('products')
              .select('company_id')
              .eq('id', targetId)
              .single();
              
            if (productInfo) {
              const { data: companyData } = await supabase
                .from('user_company_access')
                .select('access_level')
                .eq('user_id', user.id)
                .eq('company_id', productInfo.company_id)
                .single();
                
              if (companyData) {
                // If no override, use company permissions
                if (!resultLevel) {
                  const accessToPermission: Record<string, PermissionLevel> = {
                    'admin': 'A',
                    'editor': 'E',
                    'viewer': 'V'
                  };
                  resultLevel = accessToPermission[companyData.access_level] || null;
                }
              }
            }
          }
        } 
        else if (targetType === 'document') {
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
            .eq('user_id', user.id)
            .eq('document_id', targetId)
            .single() as { data: any };
            
          
          if (documentData) {
            override = documentData.override_product_permissions;
            
            // Check reviewer status
            if (documentData.is_active_reviewer) {
              reviewer = true;
              if (documentData.is_internal_reviewer) {
                revType = 'internal';
              } else if (documentData.is_external_reviewer) {
                revType = 'external';
              }
            }
            
            if (documentData.permissions.includes('A')) {
              resultLevel = 'A';
            } else if (documentData.permissions.includes('E')) {
              resultLevel = 'E';
            } else if (documentData.permissions.includes('V')) {
              resultLevel = 'V';
            }
          }
          
          // If no document-specific permissions or not overriding, check product permissions
          if (!documentData || !override) {
            const { data: documentInfo } = await supabase
              .from('documents')
              .select('product_id')
              .eq('id', targetId)
              .single();
              
            if (documentInfo) {
              // If we have a product ID, check product permissions
              const productId = documentInfo.product_id;
              if (productId) {
                // Re-use the product permission check logic
                const productPermResult = await checkProductPermission(user.id, productId, requiredLevel);
                if (!resultLevel && productPermResult.level) {
                  resultLevel = productPermResult.level;
                }
              }
            }
          }
        }
        
        const hasPerm = !!resultLevel && hasRequiredPermissionLevel(resultLevel, requiredLevel);
        
        setHasPermission(hasPerm);
        setPermissionLevel(resultLevel);
        setIsOverride(override);
        setIsReviewer(reviewer);
        setReviewerType(revType);
      } catch (error) {
        console.error(`Error checking ${targetType} permission:`, error);
        setHasPermission(false);
        setPermissionLevel(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function for product permission checks (used in document checks)
    const checkProductPermission = async (userId: string, productId: string, reqLevel: PermissionLevel) => {
      let level: PermissionLevel | null = null;
      
      // Check product-specific permissions
      const { data: productData } = await supabase
        .from('user_product_permissions')
        .select('permissions, override_company_permissions')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();
        
      if (productData) {
        if (productData.permissions.includes('A')) {
          level = 'A';
        } else if (productData.permissions.includes('E')) {
          level = 'E';
        } else if (productData.permissions.includes('V')) {
          level = 'V';
        }
        
        // If overriding company permissions, return result now
        if (productData.override_company_permissions) {
          return { level };
        }
      }
      
      // If no product-specific permissions or not overriding, check company permissions
      if (!productData || !level) {
        const { data: productInfo } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();
          
        if (productInfo) {
          const { data: companyData } = await supabase
            .from('user_company_access')
            .select('access_level')
            .eq('user_id', userId)
            .eq('company_id', productInfo.company_id)
            .single();
            
          if (companyData) {
            const accessToPermission: Record<string, PermissionLevel> = {
              'admin': 'A',
              'editor': 'E',
              'viewer': 'V'
            };
            level = accessToPermission[companyData.access_level] || null;
          }
        }
      }
      
      return { level };
    };
    
    checkPermission();
  }, [user, targetType, targetId, requiredLevel, userRole, isDevMode]);
  
  return { 
    loading, 
    hasPermission, 
    permissionLevel, 
    isOverride,
    isReviewer,
    reviewerType
  };
};
