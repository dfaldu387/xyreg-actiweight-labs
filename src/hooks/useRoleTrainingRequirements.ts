import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoleTrainingRequirement, DueType } from '@/types/training';
import { toast } from 'sonner';
import { isValidUUID } from '@/utils/uuidValidation';

export function useRoleTrainingRequirements(companyId: string | undefined) {
  return useQuery({
    queryKey: ['role-training-requirements', companyId],
    queryFn: async () => {
      if (!isValidUUID(companyId)) return [];
      
      const { data, error } = await supabase
        .from('role_training_requirements')
        .select(`
          *,
          training_module:training_modules(*),
          role:company_roles(id, name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as RoleTrainingRequirement[];
    },
    enabled: isValidUUID(companyId),
  });
}

export function useRoleRequirementsByRole(companyId: string | undefined, roleId: string | undefined) {
  return useQuery({
    queryKey: ['role-training-requirements', companyId, roleId],
    queryFn: async () => {
      if (!isValidUUID(companyId) || !isValidUUID(roleId)) return [];
      
      const { data, error } = await supabase
        .from('role_training_requirements')
        .select(`
          *,
          training_module:training_modules(*)
        `)
        .eq('company_id', companyId)
        .eq('role_id', roleId);
      
      if (error) throw error;
      return data as unknown as RoleTrainingRequirement[];
    },
    enabled: isValidUUID(companyId) && isValidUUID(roleId),
  });
}

interface CreateRoleRequirementInput {
  role_id: string;
  training_module_id: string;
  due_type: DueType;
  due_days: number;
  annual_due_month?: number | null;
  annual_due_day?: number | null;
  is_mandatory: boolean;
}

export function useCreateRoleRequirement(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateRoleRequirementInput) => {
      if (!companyId) throw new Error('Company ID required');
      
      const { data, error } = await supabase
        .from('role_training_requirements')
        .insert({
          company_id: companyId,
          ...input,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-training-requirements', companyId] });
      toast.success('Training requirement added');
    },
    onError: (error) => {
      toast.error('Failed to add training requirement');
      console.error(error);
    },
  });
}

export function useUpdateRoleRequirement(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateRoleRequirementInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('role_training_requirements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-training-requirements', companyId] });
      toast.success('Training requirement updated');
    },
    onError: (error) => {
      toast.error('Failed to update training requirement');
      console.error(error);
    },
  });
}

export function useDeleteRoleRequirement(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('role_training_requirements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-training-requirements', companyId] });
      toast.success('Training requirement removed');
    },
    onError: (error) => {
      toast.error('Failed to remove training requirement');
      console.error(error);
    },
  });
}
