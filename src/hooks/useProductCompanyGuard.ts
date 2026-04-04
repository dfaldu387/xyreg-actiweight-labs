import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name?: string;
  company_id: string | null;
}

/**
 * Hook to validate user has access to a product's company and auto-switch context if needed.
 * 
 * This replaces the old aggressive redirect logic that compared product.company_id to activeCompanyRole.companyId.
 * Instead, it checks if user has ANY access to the product's company (via companyRoles array),
 * and if so, silently auto-switches the active company context.
 * 
 * Only redirects if user genuinely doesn't have access to the product's company.
 */
export function useProductCompanyGuard(product: Product | null | undefined, isProductLoading: boolean) {
  const { companyRoles, activeCompanyRole, switchCompanyRole, isLoading: isCompanyLoading } = useCompanyRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [hasTriggeredSwitch, setHasTriggeredSwitch] = useState(false);
  const hasTriggeredSwitchRef = useRef(false); // Use ref for immediate access to prevent race conditions

  useEffect(() => {
    // Wait for both product and company roles to load
    if (isProductLoading || isCompanyLoading) {
      setIsValidating(true);
      return;
    }

    // No product loaded yet
    if (!product) {
      setIsValidating(true);
      return;
    }

    // Product has no company_id (shouldn't happen but handle gracefully)
    if (!product.company_id) {
      console.warn('[useProductCompanyGuard] Product has no company_id:', product.id);
      setIsValidating(false);
      return;
    }

    // Check if user has access to the product's company via ANY of their company roles
    const hasAccessToProductCompany = companyRoles.some(
      role => role.companyId === product.company_id
    );

    if (!hasAccessToProductCompany) {
      // User genuinely doesn't have access to this product's company
      console.error('[ACCESS DENIED] User does not have access to product company:', {
        productId: product.id,
        productName: product.name,
        productCompanyId: product.company_id,
        userCompanyRoles: companyRoles.map(r => ({ id: r.companyId, name: r.companyName })),
        timestamp: new Date().toISOString()
      });

      toast.error('Access denied: You do not have access to this product');
      navigate('/app', { replace: true });
      return;
    }

    // Check device-level access via user_product_matrix
    const checkDeviceAccess = async () => {
      if (!user?.id || !product.company_id) {
        setIsValidating(false);
        return;
      }

      // Check if user is owner or admin — they always have access to all devices
      const { data: accessRows } = await supabase
        .from('user_company_access')
        .select('access_level, is_primary, is_invite_user')
        .eq('user_id', user.id)
        .eq('company_id', product.company_id)
        .limit(1);

      const accessData = accessRows?.[0] || null;
      const isOwner = accessData?.is_primary === true && !accessData?.is_invite_user;
      const isOwnerOrAdmin = isOwner || accessData?.access_level === 'admin';

      if (!isOwnerOrAdmin) {
        // Non-admin: check user_product_matrix for device-level access
        const { data: matrixRows } = await supabase
          .from('user_product_matrix')
          .select('product_ids')
          .eq('user_id', user.id)
          .eq('company_id', product.company_id)
          .eq('is_active', true)
          .limit(1);

        const matrixData = matrixRows?.[0] || null;

        // If there's an active matrix record, enforce its product_ids restriction
        // If no active record exists, user has unrestricted access (no filtering needed)
        if (matrixData) {
          const allowedProductIds = new Set<string>(matrixData.product_ids || []);

          if (!allowedProductIds.has(product.id)) {
            console.error('[ACCESS DENIED] User does not have device access to this product:', {
              productId: product.id,
              productName: product.name,
              allowedProductIds: Array.from(allowedProductIds),
            });

            toast.error('Access denied: You do not have access to this device');
            navigate('/app', { replace: true });
            return;
          }
        }
      }

      // Device access validated — proceed with company context switch if needed
      if (activeCompanyRole?.companyId !== product.company_id && !hasTriggeredSwitch && !hasTriggeredSwitchRef.current) {
        const matchingRole = companyRoles.find(r => r.companyId === product.company_id);

        console.log('[useProductCompanyGuard] Auto-switching company context:', {
          fromCompany: activeCompanyRole?.companyName,
          toCompany: matchingRole?.companyName,
          productId: product.id
        });

        hasTriggeredSwitchRef.current = true;
        setHasTriggeredSwitch(true);

        switchCompanyRole(product.company_id, {
          updateUserMetadata: true,
          navigateToCompany: false
        }).then(() => {
          setIsValidating(false);
        }).catch((error) => {
          console.error('[useProductCompanyGuard] Failed to switch company:', error);
          setIsValidating(false);
        });
      } else {
        setIsValidating(false);
      }
    };

    checkDeviceAccess();
  }, [product, companyRoles, isProductLoading, isCompanyLoading, activeCompanyRole, switchCompanyRole, navigate, hasTriggeredSwitch, user]);

  // Reset BOTH ref and state when product changes
  useEffect(() => {
    hasTriggeredSwitchRef.current = false;
    setHasTriggeredSwitch(false);
  }, [product?.id]);

  return { isValidating };
}
