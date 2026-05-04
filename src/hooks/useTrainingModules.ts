import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrainingModule, TrainingModuleFormData } from '@/types/training';
import { toast } from 'sonner';
import { isValidUUID } from '@/utils/uuidValidation';
import { getGroupForSOP } from '@/constants/trainingGroups';
import { syncTrainingModulesFromApprovedSOPs } from '@/services/trainingAutoLinkService';

export function useTrainingModules(companyId: string | undefined) {
  return useQuery({
    queryKey: ['training-modules', companyId],
    queryFn: async () => {
      if (!isValidUUID(companyId)) return [];
      
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return data as TrainingModule[];
    },
    enabled: isValidUUID(companyId),
  });
}

export function useCreateTrainingModule(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: TrainingModuleFormData) => {
      if (!companyId) throw new Error('Company ID required');
      
      const { data, error } = await supabase
        .from('training_modules')
        .insert({
          company_id: companyId,
          ...formData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules', companyId] });
      toast.success('Training module created');
    },
    onError: (error) => {
      toast.error('Failed to create training module');
      console.error(error);
    },
  });
}

export function useUpdateTrainingModule(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...formData }: TrainingModuleFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('training_modules')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules', companyId] });
      toast.success('Training module updated');
    },
    onError: (error) => {
      toast.error('Failed to update training module');
      console.error(error);
    },
  });
}

export function useDeleteTrainingModule(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules', companyId] });
      toast.success('Training module deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete training module');
      console.error(error);
    },
  });
}

export function useSyncModulesFromApprovedSOPs(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Company ID required');
      return await syncTrainingModulesFromApprovedSOPs(companyId);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['training-modules', companyId] });
      const reissued = (res as any).reissued ?? 0;
      if (res.created === 0 && res.updated === 0) {
        toast.info('Training modules are already in sync with your SOPs');
      } else {
        const parts: string[] = [];
        if (res.created) parts.push(`${res.created} new`);
        if (res.updated) parts.push(`${res.updated} updated`);
        if (reissued) parts.push(`${reissued} re-training records issued`);
        toast.success(`Synced from approved SOPs: ${parts.join(', ')}`);
      }
    },
    onError: (error) => {
      toast.error('Failed to sync training modules from SOPs');
      console.error(error);
    },
  });
}

// Back-compat alias (deprecated): re-export under the old name so any
// stragglers keep compiling. Prefer useSyncModulesFromApprovedSOPs.
export const useSeedTrainingModulesFromSOPs = useSyncModulesFromApprovedSOPs;
