import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ItemExclusionScope } from '@/hooks/useInheritanceExclusion';

/**
 * Hook to manage device_scope on a phase_assigned_document_template record.
 * Used for non-inherited (local/master) doc CIs so they can declare
 * which devices they apply to — same shape as ItemExclusionScope.
 */
export function useDocumentCIScope(documentIds: string[]) {
  const [scopes, setScopes] = useState<Record<string, ItemExclusionScope>>({});
  const [loaded, setLoaded] = useState(false);

  // Batch-load device_scope for all doc IDs
  useEffect(() => {
    if (documentIds.length === 0) {
      setScopes({});
      setLoaded(true);
      return;
    }

    const load = async () => {
      // Normalize IDs (strip template- prefix)
      const normalizedIds = documentIds.map(id => id.replace(/^template-/, ''));

      const { data } = await supabase
        .from('phase_assigned_document_template')
        .select('id, device_scope')
        .in('id', normalizedIds);

      const result: Record<string, ItemExclusionScope> = {};
      (data || []).forEach((row: any) => {
        if (row.device_scope && typeof row.device_scope === 'object') {
          result[row.id] = row.device_scope as ItemExclusionScope;
        }
      });
      setScopes(result);
      setLoaded(true);
    };

    load();
  }, [documentIds.join(',')]);

  const getScope = useCallback((docId: string): ItemExclusionScope => {
    const normalized = docId.replace(/^template-/, '');
    return scopes[normalized] || {};
  }, [scopes]);

  const setScope = useCallback(async (docId: string, scope: ItemExclusionScope) => {
    const normalized = docId.replace(/^template-/, '');

    // Clean empty scope → null
    const hasExclusions =
      (scope.excludedProductIds?.length ?? 0) > 0 ||
      (scope.excludedCategories?.length ?? 0) > 0;

    const dbValue = hasExclusions ? scope : null;

    // Optimistic update
    setScopes(prev => {
      const next = { ...prev };
      if (hasExclusions) {
        next[normalized] = scope;
      } else {
        delete next[normalized];
      }
      return next;
    });

    await supabase
      .from('phase_assigned_document_template')
      .update({ device_scope: dbValue as any })
      .eq('id', normalized);
  }, []);

  return { scopes, loaded, getScope, setScope };
}
