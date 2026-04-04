import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Per-clause exclusion scope for gap analysis.
 * Stored in field_scope_overrides.gap_clause_exclusions as:
 *   { "FRAMEWORK.SECTION": ["productId1", "productId2"] }
 */
export interface GapClauseExclusions {
  [clauseKey: string]: string[]; // excluded product IDs
}

/**
 * Manages which gap analysis frameworks are shared across the product family,
 * plus per-clause exclusion overrides.
 */
export function useGapFamilySharing(productId: string | undefined) {
  const queryClient = useQueryClient();
  const [sharedFrameworks, setSharedFrameworks] = useState<string[]>([]);
  const [clauseExclusions, setClauseExclusions] = useState<GapClauseExclusions>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSharedFrameworks([]);
    setClauseExclusions({});
    if (!productId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('field_scope_overrides')
          .eq('id', productId)
          .single();

        const overrides = (data?.field_scope_overrides as Record<string, any>) || {};
        const stored = overrides.gap_frameworks_shared;
        setSharedFrameworks(Array.isArray(stored) ? stored : []);
        const exclusions = overrides.gap_clause_exclusions;
        setClauseExclusions(exclusions && typeof exclusions === 'object' ? exclusions : {});
      } catch (err) {
        console.error('[useGapFamilySharing] Error loading:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [productId]);

  const isFrameworkShared = useCallback(
    (framework: string) => sharedFrameworks.includes(framework),
    [sharedFrameworks]
  );

  /** Build clause key from framework + section */
  const clauseKey = useCallback(
    (framework: string, section: string) => `${framework}.${section}`,
    []
  );

  /** Check if a clause is shared for a specific target product */
  const isClauseSharedForProduct = useCallback(
    (framework: string, section: string, targetProductId: string): boolean => {
      if (!sharedFrameworks.includes(framework)) return false;
      const key = `${framework}.${section}`;
      const excluded = clauseExclusions[key] || [];
      return !excluded.includes(targetProductId);
    },
    [sharedFrameworks, clauseExclusions]
  );

  /** Get excluded product IDs for a clause */
  const getClauseExcludedProducts = useCallback(
    (framework: string, section: string): string[] => {
      const key = `${framework}.${section}`;
      return clauseExclusions[key] || [];
    },
    [clauseExclusions]
  );

  /** Set excluded product IDs for a clause and persist */
  const setClauseExcludedProducts = useCallback(
    async (framework: string, section: string, excludedProductIds: string[]) => {
      if (!productId) return;

      const key = `${framework}.${section}`;
      const newExclusions = { ...clauseExclusions };

      if (excludedProductIds.length > 0) {
        newExclusions[key] = excludedProductIds;
      } else {
        delete newExclusions[key];
      }

      setClauseExclusions(newExclusions);

      try {
        const { data } = await supabase
          .from('products')
          .select('field_scope_overrides')
          .eq('id', productId)
          .single();

        const current = (data?.field_scope_overrides as Record<string, any>) || {};
        const updated = { ...current };

        if (Object.keys(newExclusions).length > 0) {
          updated.gap_clause_exclusions = newExclusions;
        } else {
          delete updated.gap_clause_exclusions;
        }

        await supabase
          .from('products')
          .update({ field_scope_overrides: updated as any })
          .eq('id', productId);

        queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
      } catch (err) {
        console.error('[useGapFamilySharing] Error saving clause exclusions:', err);
        setClauseExclusions(clauseExclusions);
      }
    },
    [productId, clauseExclusions, queryClient]
  );

  const toggleFrameworkSharing = useCallback(
    async (framework: string, shared: boolean) => {
      if (!productId) return;

      const newList = shared
        ? [...sharedFrameworks.filter(f => f !== framework), framework]
        : sharedFrameworks.filter(f => f !== framework);

      setSharedFrameworks(newList);

      try {
        const { data } = await supabase
          .from('products')
          .select('field_scope_overrides')
          .eq('id', productId)
          .single();

        const current = (data?.field_scope_overrides as Record<string, any>) || {};
        const updated = { ...current };

        if (newList.length > 0) {
          updated.gap_frameworks_shared = newList;
        } else {
          delete updated.gap_frameworks_shared;
        }

        await supabase
          .from('products')
          .update({ field_scope_overrides: updated as any })
          .eq('id', productId);

        queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
      } catch (err) {
        console.error('[useGapFamilySharing] Error saving:', err);
        setSharedFrameworks(sharedFrameworks);
      }
    },
    [productId, sharedFrameworks, queryClient]
  );

  return {
    sharedFrameworks,
    clauseExclusions,
    isFrameworkShared,
    isClauseSharedForProduct,
    getClauseExcludedProducts,
    setClauseExcludedProducts,
    toggleFrameworkSharing,
    isLoading,
  };
}
