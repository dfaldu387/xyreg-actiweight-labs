import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ProductSiblingGroup,
  ProductSiblingAssignment,
  CreateSiblingGroupData,
  UpdateSiblingGroupData,
} from '@/types/siblingGroup';

export function useSiblingGroups(basicUdiDi?: string) {
  return useQuery({
    queryKey: ['sibling-groups', basicUdiDi],
    queryFn: async () => {
      if (!basicUdiDi) return [];

      const { data, error } = await supabase
        .from('product_sibling_groups')
        .select(`
          *,
          product_sibling_assignments!inner (
            id,
            product_id,
            percentage,
            position,
            product:products (
              id,
              name,
              trade_name
            )
          )
        `)
        .eq('basic_udi_di', basicUdiDi)
        .order('position', { ascending: true })
        .order('position', { referencedTable: 'product_sibling_assignments', ascending: true });

      if (error) throw error;
      return data as (ProductSiblingGroup & { 
        product_sibling_assignments: (ProductSiblingAssignment & {
          product: { id: string; name: string; trade_name: string | null } | null;
        })[]
      })[];
    },
    enabled: !!basicUdiDi,
  });
}

export function useCreateSiblingGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSiblingGroupData) => {
      const { data: result, error } = await supabase
        .from('product_sibling_groups')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as ProductSiblingGroup;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sibling-groups', variables.basic_udi_di],
      });
      queryClient.invalidateQueries({
        queryKey: ['company-basic-udi-groups', variables.company_id],
      });
      toast.success('Sibling group created');
    },
    onError: (error: any) => {
      toast.error('Failed to create sibling group', {
        description: error.message,
      });
    },
  });
}

export function useUpdateSiblingGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      basicUdiDi,
      companyId,
      data,
    }: {
      id: string;
      basicUdiDi: string;
      companyId?: string;
      data: UpdateSiblingGroupData;
    }) => {
      const { data: result, error } = await supabase
        .from('product_sibling_groups')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ProductSiblingGroup;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sibling-groups', variables.basicUdiDi],
      });
      if (variables.companyId) {
        queryClient.invalidateQueries({
          queryKey: ['company-basic-udi-groups', variables.companyId],
        });
      }
      toast.success('Sibling group updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update sibling group', {
        description: error.message,
      });
    },
  });
}

export function useDeleteSiblingGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      basicUdiDi, 
      companyId 
    }: { 
      id: string; 
      basicUdiDi: string; 
      companyId?: string;
    }) => {
      const { error } = await supabase
        .from('product_sibling_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sibling-groups', variables.basicUdiDi],
      });
      if (variables.companyId) {
        queryClient.invalidateQueries({
          queryKey: ['company-basic-udi-groups', variables.companyId],
        });
      }
      toast.success('Sibling group deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete sibling group', {
        description: error.message,
      });
    },
  });
}

export function useAddSiblingToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      siblingId, 
      groupId, 
      percentage = 0, 
      position = 0 
    }: { 
      siblingId: string; 
      groupId: string; 
      percentage?: number; 
      position?: number;
    }) => {
      // Add assignment with percentage and position
      const { error } = await supabase
        .from('product_sibling_assignments')
        .insert({
          product_id: siblingId,
          sibling_group_id: groupId,
          percentage,
          position
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sibling-groups'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-basic-udi'] });
      toast.success('Product added to group');
    },
    onError: (error: any) => {
      toast.error('Failed to add product to group', {
        description: error.message,
      });
    },
  });
}

export function useUpdateSiblingAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: { percentage?: number; position?: number };
    }) => {
      const { error } = await supabase
        .from('product_sibling_assignments')
        .update(data)
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all sibling group queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['sibling-groups'] });
      queryClient.invalidateQueries({ queryKey: ['company-basic-udi-groups'] });
    },
  });
}

export function useRemoveSiblingFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('product_sibling_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sibling-groups'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-basic-udi'] });
      toast.success('Product removed from group');
    },
    onError: (error: any) => {
      toast.error('Failed to remove product from group', {
        description: error.message,
      });
    },
  });
}
