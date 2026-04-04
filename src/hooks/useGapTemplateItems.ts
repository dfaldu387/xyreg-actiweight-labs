import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GapTemplateItem {
  item_number: string;
  sort_order: number;
  template_id: string;
  framework: string;
}

/**
 * Hook to fetch and cache gap template items.
 * Uses React Query to share data across components and prevent duplicate API calls.
 *
 * Gap template items rarely change, so we use a long cache time.
 */
export function useGapTemplateItems() {
  return useQuery({
    queryKey: ['gap-template-items'],
    queryFn: async (): Promise<GapTemplateItem[]> => {
      const { data, error } = await supabase
        .from('gap_template_items')
        .select('item_number, sort_order, template_id, gap_analysis_templates!inner(framework)');

      if (error) {
        console.error('[useGapTemplateItems] Error fetching:', error);
        throw error;
      }

      // Flatten the framework from the join
      return (data || []).map((item: any) => ({
        item_number: item.item_number,
        sort_order: item.sort_order,
        template_id: item.template_id,
        framework: item.gap_analysis_templates?.framework || ''
      }));
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes - gap template items rarely change
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
}

/**
 * Helper function to create a sort order map from gap template items
 */
export function createSortOrderMap(items: GapTemplateItem[]): Map<string, number> {
  const sortOrderMap = new Map<string, number>();
  items.forEach((item) => {
    if (item.framework && item.item_number) {
      const key = `${item.framework}:${item.item_number}`;
      sortOrderMap.set(key, item.sort_order || 999999);
    }
  });
  return sortOrderMap;
}
