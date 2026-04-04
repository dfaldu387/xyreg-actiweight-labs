import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing hazard exclusions on variant devices.
 * Stores excluded hazard IDs in the product's `field_scope_overrides` JSONB column
 * under the key `excluded_hazards`.
 *
 * Mirrors the pattern from useDocumentCIExclusion.ts.
 */
export function useHazardExclusion(productId?: string, isVariant?: boolean) {
  const [excludedHazardIds, setExcludedHazardIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load exclusions from DB
  useEffect(() => {
    if (!productId || !isVariant) {
      setExcludedHazardIds([]);
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
      setExcludedHazardIds(
        Array.isArray(overrides.excluded_hazards)
          ? overrides.excluded_hazards
          : []
      );
      setLoaded(true);
    };

    load();
  }, [productId, isVariant]);

  // Persist exclusions to DB (read-modify-write to preserve other overrides)
  const persistExclusions = useCallback(async (newExcluded: string[]) => {
    if (!productId) return;

    const { data } = await supabase
      .from('products')
      .select('field_scope_overrides')
      .eq('id', productId)
      .single();

    const current = (data?.field_scope_overrides as Record<string, any>) || {};
    const updated = {
      ...current,
      excluded_hazards: newExcluded.length > 0 ? newExcluded : undefined,
    };

    // Clean undefined key
    if (!updated.excluded_hazards) delete updated.excluded_hazards;

    await supabase
      .from('products')
      .update({ field_scope_overrides: updated as any })
      .eq('id', productId);
  }, [productId]);

  // Toggle a hazard's exclusion state
  const toggleExclusion = useCallback((hazardId: string) => {
    setExcludedHazardIds(prev => {
      const next = prev.includes(hazardId)
        ? prev.filter(id => id !== hazardId)
        : [...prev, hazardId];
      persistExclusions(next);
      return next;
    });
  }, [persistExclusions]);

  // Check if a hazard is excluded
  const isExcluded = useCallback((hazardId: string) => {
    return excludedHazardIds.includes(hazardId);
  }, [excludedHazardIds]);

  return {
    excludedHazardIds,
    loaded,
    isExcluded,
    toggleExclusion,
  };
}
