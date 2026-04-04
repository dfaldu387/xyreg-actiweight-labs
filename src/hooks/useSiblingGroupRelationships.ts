import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiblingGroupRelationship {
  id: string;
  company_id: string;
  main_sibling_group_id: string;
  accessory_sibling_group_id: string;
  relationship_type: 'accessory' | 'bundle_item' | 'cross_sell' | 'upsell';
  revenue_attribution_percentage: number;
  initial_multiplier: number;
  recurring_multiplier: number;
  recurring_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lifecycle_duration_months: number;
  seasonality_factors: Record<string, number>;
  created_at: string;
  updated_at: string;
  main_group?: {
    id: string;
    name: string;
    basic_udi_di: string;
    distribution_pattern: string;
  };
  accessory_group?: {
    id: string;
    name: string;
    basic_udi_di: string;
    distribution_pattern: string;
  };
}

export function useSiblingGroupRelationships(companyId: string) {
  return useQuery({
    queryKey: ['sibling-group-relationships', companyId],
    queryFn: async () => {
      const { data: relationships, error: relError } = await supabase
        .from('sibling_group_relationships' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (relError) throw relError;
      if (!relationships || relationships.length === 0) return [];

      // Get all unique group IDs
      const groupIds = new Set<string>();
      relationships.forEach((rel: any) => {
        if (rel.main_sibling_group_id) groupIds.add(rel.main_sibling_group_id);
        if (rel.accessory_sibling_group_id) groupIds.add(rel.accessory_sibling_group_id);
      });

      // Fetch all groups in one query
      const { data: groups, error: groupError } = await supabase
        .from('product_sibling_groups')
        .select('id, name, basic_udi_di, distribution_pattern')
        .in('id', Array.from(groupIds));

      if (groupError) throw groupError;

      // Create a map for quick lookup
      const groupMap = new Map(groups?.map(g => [g.id, g]) || []);

      // Enrich relationships with group data
      return relationships.map((rel: any) => ({
        ...rel,
        main_group: groupMap.get(rel.main_sibling_group_id) || null,
        accessory_group: groupMap.get(rel.accessory_sibling_group_id) || null,
      })) as SiblingGroupRelationship[];
    },
    enabled: !!companyId,
  });
}

export function useCreateSiblingGroupRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SiblingGroupRelationship, 'id' | 'created_at' | 'updated_at' | 'main_group' | 'accessory_group'>) => {
      const { data: result, error } = await supabase
        .from('sibling_group_relationships' as any)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sibling-group-relationships', variables.company_id] });
      toast.success('Group relationship created');
    },
    onError: (error: any) => {
      toast.error('Failed to create group relationship', {
        description: error.message,
      });
    },
  });
}

export function useUpdateSiblingGroupRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SiblingGroupRelationship> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('sibling_group_relationships' as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      if (result && (result as any).company_id) {
        queryClient.invalidateQueries({ queryKey: ['sibling-group-relationships', (result as any).company_id] });
      }
      toast.success('Group relationship updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update group relationship', {
        description: error.message,
      });
    },
  });
}

export function useDeleteSiblingGroupRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from('sibling_group_relationships' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sibling-group-relationships', variables.companyId] });
      toast.success('Group relationship deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete group relationship', {
        description: error.message,
      });
    },
  });
}
