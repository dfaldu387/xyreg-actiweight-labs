import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useToggleMergeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      basicUdiDi,
      companyId,
      displayAsMerged,
    }: {
      groupId?: string;
      basicUdiDi: string;
      companyId: string;
      displayAsMerged: boolean;
    }) => {
      // If groupId exists, update it
      if (groupId) {
        const { error } = await supabase
          .from('basic_udi_di_groups')
          .update({ display_as_merged: displayAsMerged })
          .eq('id', groupId);

        if (error) throw error;
      } else {
        // Otherwise, create a new basic_udi_di_groups record
        const { error } = await supabase
          .from('basic_udi_di_groups')
          .insert({
            company_id: companyId,
            basic_udi_di: basicUdiDi,
            display_as_merged: displayAsMerged,
            internal_reference: '',
            company_prefix: '',
            check_character: '',
            issuing_agency: 'GS1',
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['company-basic-udi-groups', variables.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ['product-family-products', variables.companyId, variables.basicUdiDi],
      });
      toast.success(variables.displayAsMerged ? 'Cards merged' : 'Cards unmerged');
    },
    onError: (error: any) => {
      toast.error('Failed to update merge status', {
        description: error.message,
      });
    },
  });
}

export function useUpdateBasicUDIGroupName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      basicUdiDi,
      companyId,
      name,
    }: {
      groupId?: string;
      basicUdiDi: string;
      companyId: string;
      name: string;
    }) => {
      // If groupId exists, update it
      if (groupId) {
        const { error } = await supabase
          .from('basic_udi_di_groups')
          .update({ internal_reference: name })
          .eq('id', groupId);

        if (error) throw error;
      } else {
        // Otherwise, create a new basic_udi_di_groups record
        const { error } = await supabase
          .from('basic_udi_di_groups')
          .insert({
            company_id: companyId,
            basic_udi_di: basicUdiDi,
            internal_reference: name,
            company_prefix: '',
            check_character: '',
            issuing_agency: 'GS1',
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['company-basic-udi-groups', variables.companyId],
      });
      toast.success('Group name updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update group name', {
        description: error.message,
      });
    },
  });
}

