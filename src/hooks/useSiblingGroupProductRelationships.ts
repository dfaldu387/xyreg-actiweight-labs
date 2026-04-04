import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSiblingGroupProductRelationships(companyId: string) {
  return useQuery({
    queryKey: ['siblingGroupProductRelationships', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sibling_group_product_relationships')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateSiblingGroupProductRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('sibling_group_product_relationships')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['siblingGroupProductRelationships', variables.company_id] 
      });
    },
  });
}

export function useUpdateSiblingGroupProductRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('sibling_group_product_relationships')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['siblingGroupProductRelationships', variables.company_id] 
      });
    },
  });
}

export function useDeleteSiblingGroupProductRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sibling_group_product_relationships')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['siblingGroupProductRelationships'] 
      });
    },
  });
}
