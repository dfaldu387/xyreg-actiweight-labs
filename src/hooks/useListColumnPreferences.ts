import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ListModuleType, ListViewType, ListColumnPreference } from '@/types/listColumnPreferences';

/**
 * Fetch column preferences for a specific company + product + module
 */
export function useListColumnPreferences(
  companyId: string,
  productId: string | null,
  module: ListModuleType,
  viewKey: ListViewType = 'list'
) {
  return useQuery({
    queryKey: ['list-column-preferences', companyId, productId, module, viewKey],
    queryFn: async () => {
      let query = (supabase as any)
        .from('list_column_preferences')
        .select('*')
        .eq('company_id', companyId)
        .eq('module', module)
        .eq('view_key', viewKey);

      if (productId) {
        query = query.eq('product_id', productId);
      } else {
        query = query.is('product_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as ListColumnPreference | null;
    },
    enabled: !!companyId && !!module,
  });
}

/**
 * Save (upsert) column preferences
 */
export function useSaveListColumnPreferences(
  companyId: string,
  productId: string | null,
  module: ListModuleType,
  viewKey: ListViewType = 'list'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { hidden_columns: string[]; column_order?: string[] }) => {
      // Check if record exists
      let existingQuery = (supabase as any)
        .from('list_column_preferences')
        .select('id')
        .eq('company_id', companyId)
        .eq('module', module)
        .eq('view_key', viewKey);

      if (productId) {
        existingQuery = existingQuery.eq('product_id', productId);
      } else {
        existingQuery = existingQuery.is('product_id', null);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      const row = {
        company_id: companyId,
        product_id: productId,
        module,
        view_key: viewKey,
        hidden_columns: data.hidden_columns,
        column_order: data.column_order || [],
      };

      let result, error;
      if (existing?.id) {
        ({ data: result, error } = await (supabase as any)
          .from('list_column_preferences')
          .update({ hidden_columns: data.hidden_columns, column_order: data.column_order || [] })
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        ({ data: result, error } = await (supabase as any)
          .from('list_column_preferences')
          .insert(row)
          .select()
          .single());
      }

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['list-column-preferences', companyId, productId, module, viewKey],
      });
    },
  });
}
