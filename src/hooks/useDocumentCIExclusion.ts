import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing document CI exclusions on variant devices.
 * Stores excluded document IDs in the product's `field_scope_overrides` JSONB column
 * under the key `excluded_document_cis`.
 *
 * Follows the same pattern as FeaturesTab.tsx exclusion logic.
 */
export function useDocumentCIExclusion(productId?: string, isVariant?: boolean) {
  const [excludedDocIds, setExcludedDocIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load exclusions from DB
  useEffect(() => {
    if (!productId || !isVariant) {
      setExcludedDocIds([]);
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
      setExcludedDocIds(
        Array.isArray(overrides.excluded_document_cis)
          ? overrides.excluded_document_cis
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
      excluded_document_cis: newExcluded.length > 0 ? newExcluded : undefined,
    };

    // Clean undefined key
    if (!updated.excluded_document_cis) delete updated.excluded_document_cis;

    await supabase
      .from('products')
      .update({ field_scope_overrides: updated as any })
      .eq('id', productId);
  }, [productId]);

  // Toggle a document's exclusion state
  const toggleExclusion = useCallback((docId: string) => {
    setExcludedDocIds(prev => {
      const next = prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId];
      persistExclusions(next);
      return next;
    });
  }, [persistExclusions]);

  // Check if a document is excluded
  const isExcluded = useCallback((docId: string) => {
    return excludedDocIds.includes(docId);
  }, [excludedDocIds]);

  return {
    excludedDocIds,
    loaded,
    isExcluded,
    toggleExclusion,
  };
}
