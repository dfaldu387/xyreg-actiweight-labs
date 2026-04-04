import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductVariantDistribution, CreateVariantDistributionData, UpdateVariantDistributionData } from '@/types/productVariantDistribution';

export function useVariantDistributions(relationshipId?: string) {
  return useQuery({
    queryKey: ['variant-distributions', relationshipId],
    queryFn: async () => {
      if (!relationshipId) return [];

      const { data, error } = await supabase
        .from('product_variant_distributions')
        .select(`
          *,
          target_variant:product_variants!target_variant_id(id, name),
          source_variant:product_variants!source_variant_id(id, name)
        `)
        .eq('relationship_id', relationshipId);

      if (error) throw error;
      return data as (ProductVariantDistribution & {
        target_variant: { id: string; name: string };
        source_variant?: { id: string; name: string };
      })[];
    },
    enabled: !!relationshipId,
  });
}

export function useCreateVariantDistribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateVariantDistributionData) => {
      const { data: result, error } = await supabase
        .from('product_variant_distributions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['variant-distributions', variables.relationship_id] 
      });
      toast({
        title: "Success",
        description: "Variant distribution created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create variant distribution",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateVariantDistribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVariantDistributionData }) => {
      const { data: result, error } = await supabase
        .from('product_variant_distributions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-distributions'] });
      toast({
        title: "Success",
        description: "Variant distribution updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update variant distribution",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteVariantDistribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variant_distributions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-distributions'] });
      toast({
        title: "Success",
        description: "Variant distribution deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete variant distribution",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRelationshipVariantDistribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      relationshipId, 
      hasVariantDistribution, 
      distributionMethod 
    }: { 
      relationshipId: string; 
      hasVariantDistribution: boolean; 
      distributionMethod: 'fixed_percentages' | 'conditional_logic' | 'equal_distribution';
    }) => {
      const { data: result, error } = await supabase
        .from('product_accessory_relationships')
        .update({
          has_variant_distribution: hasVariantDistribution,
          distribution_method: distributionMethod
        })
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-relationships'] });
      toast({
        title: "Success",
        description: "Relationship variant distribution settings updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update relationship settings",
        variant: "destructive",
      });
    },
  });
}