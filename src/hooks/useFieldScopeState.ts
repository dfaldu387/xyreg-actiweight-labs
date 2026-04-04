import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type FieldScope = 'individual' | 'product_family';

interface FieldScopeOverrides {
  [fieldKey: string]: FieldScope;
}

interface UseFieldScopeStateReturn {
  getFieldScope: (fieldKey: string) => FieldScope;
  setFieldScope: (fieldKey: string, scope: FieldScope) => void;
  isLoading: boolean;
  overrides: FieldScopeOverrides;
}

/**
 * Manages per-field IP/PF scope state for a product.
 * Reads/writes to the `field_scope_overrides` JSONB column on the products table.
 * Fields not in the overrides object default to 'product_family'.
 */
export function useFieldScopeState(
  productId: string | undefined,
  belongsToFamily: boolean
): UseFieldScopeStateReturn {
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<FieldScopeOverrides>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load overrides from DB
  useEffect(() => {
    if (!productId || !belongsToFamily) return;

    const loadOverrides = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('field_scope_overrides')
          .eq('id', productId)
          .single();

        if (error) throw error;
        if (data?.field_scope_overrides && typeof data.field_scope_overrides === 'object') {
          setOverrides(data.field_scope_overrides as FieldScopeOverrides);
        }
      } catch (err) {
        console.error('[useFieldScopeState] Error loading overrides:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverrides();
  }, [productId, belongsToFamily]);

  const getFieldScope = useCallback(
    (fieldKey: string): FieldScope => {
      if (!belongsToFamily) return 'individual';
      return overrides[fieldKey] || 'product_family';
    },
    [overrides, belongsToFamily]
  );

  const setFieldScope = useCallback(
    async (fieldKey: string, scope: FieldScope) => {
      if (!productId) return;

      const newOverrides = { ...overrides };
      if (scope === 'product_family') {
        delete newOverrides[fieldKey]; // Default is PF, so remove the override
      } else {
        newOverrides[fieldKey] = scope;
      }

      setOverrides(newOverrides);

      // Persist to DB
      try {
        const { error } = await supabase
          .from('products')
          .update({ field_scope_overrides: newOverrides as any })
          .eq('id', productId);

        if (error) throw error;
        // Invalidate the widget's query so it picks up the change immediately
        queryClient.invalidateQueries({ queryKey: ['field-scope-overrides', productId] });
      } catch (err) {
        console.error('[useFieldScopeState] Error saving overrides:', err);
        // Revert on error
        setOverrides(overrides);
      }
    },
    [productId, overrides]
  );

  return {
    getFieldScope,
    setFieldScope,
    isLoading,
    overrides,
  };
}
