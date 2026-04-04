import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Per-item exclusion scope: which devices/categories should NOT receive this item.
 * An empty object or missing entry means "included for all devices" (default).
 */
export interface ItemExclusionScope {
  excludedProductIds?: string[];
  excludedCategories?: string[];
  isManualGroup?: boolean;
}

/**
 * Generic hook for managing per-item device/category exclusion scopes on variant products.
 * Stores data in `field_scope_overrides.<storageKey>` as Record<itemId, ItemExclusionScope>.
 *
 * Works for both hazard and document CI exclusions.
 */
export function useInheritanceExclusion(
  productId: string | undefined,
  isVariant: boolean | undefined,
  storageKey: 'hazard_exclusion_scopes' | 'document_ci_exclusion_scopes' | 'feature_exclusion_scopes' | 'component_exclusion_scopes' | 'classification_exclusion_scopes' | 'market_exclusion_scopes'
) {
  const [scopes, setScopes] = useState<Record<string, ItemExclusionScope>>({});
  const scopesRef = useRef(scopes);
  scopesRef.current = scopes;
  const [loaded, setLoaded] = useState(false);

  // Load from DB
  useEffect(() => {
    // Reset immediately on productId change to prevent stale cross-product data
    setScopes({});
    setLoaded(false);

    if (!productId) {
      setLoaded(true);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('field_scope_overrides')
        .eq('id', productId)
        .single();

      const overrides = (data?.field_scope_overrides as Record<string, any>) || {};
      const stored = overrides[storageKey];
      setScopes(stored && typeof stored === 'object' ? stored : {});
      setLoaded(true);
    };

    load();
  }, [productId, isVariant, storageKey]);

  // Persist to DB
  const persistScopes = useCallback(async (newScopes: Record<string, ItemExclusionScope>) => {
    if (!productId) return;

    const { data } = await supabase
      .from('products')
      .select('field_scope_overrides')
      .eq('id', productId)
      .single();

    const current = (data?.field_scope_overrides as Record<string, any>) || {};
    
    // Also migrate old simple arrays if present
    const updated = { ...current };
    
    // Clean up old format keys
    if (storageKey === 'hazard_exclusion_scopes') {
      delete updated.excluded_hazards;
    } else if (storageKey === 'document_ci_exclusion_scopes') {
      delete updated.excluded_document_cis;
    }

    // Clean empty scopes (but preserve manual groups — empty exclusions means "all devices in group")
    const cleanedScopes: Record<string, ItemExclusionScope> = {};
    for (const [id, scope] of Object.entries(newScopes)) {
      const hasExclusions = (scope.excludedProductIds?.length ?? 0) > 0 || (scope.excludedCategories?.length ?? 0) > 0;
      if (hasExclusions || scope.isManualGroup) {
        cleanedScopes[id] = scope;
      }
    }

    if (Object.keys(cleanedScopes).length > 0) {
      updated[storageKey] = cleanedScopes;
    } else {
      delete updated[storageKey];
    }

    await supabase
      .from('products')
      .update({ field_scope_overrides: updated as any })
      .eq('id', productId);
  }, [productId, storageKey]);

  // Get exclusion scope for an item (stable reference — reads from ref)
  const getExclusionScope = useCallback((itemId: string): ItemExclusionScope => {
    return scopesRef.current[itemId] || {};
  }, []);

  // Set exclusion scope for an item — returns a promise that resolves after DB persistence
  const setExclusionScope = useCallback((itemId: string, scope: ItemExclusionScope): Promise<void> => {
    const next = { ...scopesRef.current, [itemId]: scope };
    scopesRef.current = next;
    setScopes(next);
    return persistScopes(next);
  }, [persistScopes]);

  // Check if item excludes a specific product (or the current product) (stable reference)
  const isExcludedForProduct = useCallback((itemId: string, targetProductId?: string): boolean => {
    const scope = scopesRef.current[itemId];
    if (!scope) return false;
    if (targetProductId) {
      return (scope.excludedProductIds || []).includes(targetProductId);
    }
    // Fallback: any exclusions at all
    return (scope.excludedProductIds?.length ?? 0) > 0 || (scope.excludedCategories?.length ?? 0) > 0;
  }, []);

  // Backward-compat alias
  const isFullyExcluded = isExcludedForProduct;

  // Simple toggle: fully exclude or fully include (backward compat with old Switch behavior)
  const toggleFullExclusion = useCallback((itemId: string, allProductIds: string[]) => {
    setScopes(prev => {
      const current = prev[itemId];
      const isCurrentlyExcluded = current && (current.excludedProductIds?.length ?? 0) > 0;
      const next = {
        ...prev,
        [itemId]: isCurrentlyExcluded ? {} : { excludedProductIds: allProductIds },
      };
      persistScopes(next);
      return next;
    });
  }, [persistScopes]);

  // Get summary text for badge display (stable reference)
  const getExclusionSummary = useCallback((itemId: string, totalProducts: number, validProductIds?: string[]): string => {
    const scope = scopesRef.current[itemId];
    if (!scope) return `All devices (${totalProducts})`;

    // Filter excluded IDs to only count valid (current company) products
    let excludedCount = scope.excludedProductIds?.length ?? 0;
    if (validProductIds && scope.excludedProductIds) {
      const validSet = new Set(validProductIds);
      excludedCount = scope.excludedProductIds.filter(id => validSet.has(id)).length;
    }
    const excludedCats = scope.excludedCategories?.length ?? 0;
    if (excludedCount === 0 && excludedCats === 0) return `All devices (${totalProducts})`;
    if (excludedCount >= totalProducts) return 'No devices';
    const activeCount = totalProducts - excludedCount;
    return `${activeCount} of ${totalProducts} devices`;
  }, []);

  return {
    scopes,
    loaded,
    getExclusionScope,
    setExclusionScope,
    isFullyExcluded,
    toggleFullExclusion,
    getExclusionSummary,
  };
}
