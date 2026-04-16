import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if the current user has access to specific device modules.
 * Reads from user_product_matrix.permissions.device_modules.
 *
 * Returns null if no restrictions (user can access everything).
 * Returns string[] of allowed module IDs if restricted.
 */
export function useDeviceModuleAccess(productId: string | null) {
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevProductIdRef = useRef<string | null>(null);
  const hasEverLoadedRef = useRef(false);
  // Cache: companyId -> permissions object (avoid re-fetching on device switch)
  const permsCacheRef = useRef<{ companyId: string; perms: any } | null>(null);

  useEffect(() => {
    if (!productId) {
      // Don't set isLoading to false — keep loading until we get a real productId
      // This prevents the flash of all menus on initial render
      setAllowedModules(null);
      return;
    }

    // Reset immediately on product change to prevent stale menus
    if (prevProductIdRef.current !== productId) {
      prevProductIdRef.current = productId;
      setIsLoading(true);
    }

    let cancelled = false;

    const fetchAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) { setAllowedModules(null); setIsLoading(false); }
          return;
        }

        // Get the product's company_id
        const { data: product } = await supabase
          .from('products')
          .select('company_id')
          .eq('id', productId)
          .single();

        if (!product || cancelled) {
          if (!cancelled) { setAllowedModules(null); setIsLoading(false); }
          return;
        }

        // Use cache if same company
        let perms: any = null;
        if (permsCacheRef.current?.companyId === product.company_id) {
          perms = permsCacheRef.current.perms;
        } else {
          // Fetch fresh
          const { data: matrix } = await supabase
            .from('user_product_matrix')
            .select('permissions')
            .eq('user_id', user.id)
            .eq('company_id', product.company_id)
            .eq('is_active', true)
            .maybeSingle();

          if (cancelled) return;

          perms = (matrix?.permissions as any) || null;
          permsCacheRef.current = { companyId: product.company_id, perms };
        }

        if (!perms) {
          setAllowedModules(null);
          setIsLoading(false);
          return;
        }

        const deviceModules = perms?.device_modules?.[productId];

        if (deviceModules && Array.isArray(deviceModules) && deviceModules.length > 0) {
          setAllowedModules(deviceModules);
        } else {
          setAllowedModules(null); // No restrictions for this device
        }
      } catch (error) {
        console.error('Error fetching device module access:', error);
        if (!cancelled) setAllowedModules(null);
      } finally {
        if (!cancelled) {
          hasEverLoadedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    fetchAccess();

    return () => { cancelled = true; };
  }, [productId]);

  /**
   * Check if a specific module is accessible.
   * While loading: hide all menus (prevent flicker of full menu then restricted).
   * No restrictions (null): show all.
   * Restricted: only show allowed.
   */
  // Determine effective loading state — true if we haven't loaded yet for any productId
  const effectiveLoading = productId ? (isLoading || !hasEverLoadedRef.current) : false;

  const hasAccess = (moduleId: string): boolean => {
    if (effectiveLoading) return true; // Show all while loading
    if (allowedModules === null) return true; // No restrictions

    // Direct match
    if (allowedModules.includes(moduleId)) return true;

    // Sub-menu check: if moduleId is "parent.child", check if parent has access
    // and no sub-menu restrictions exist for this parent (backward compat)
    if (moduleId.includes('.')) {
      const parentId = moduleId.split('.')[0];
      if (!allowedModules.includes(parentId)) return false;
      // If parent is enabled but no sub-menu IDs exist for this parent, allow all children
      const hasAnySubPerms = allowedModules.some(m => m.startsWith(`${parentId}.`));
      if (!hasAnySubPerms) return true; // No granular sub-perms = all children allowed
      return false; // Has granular perms but this sub isn't included
    }

    return false;
  };

  return { allowedModules, hasAccess, isLoading: effectiveLoading };
}
