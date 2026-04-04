import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrainingModule, TrainingModuleFormData } from '@/types/training';
import { toast } from 'sonner';
import { isValidUUID } from '@/utils/uuidValidation';
import { getGroupForSOP } from '@/constants/trainingGroups';

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

export function useSeedTrainingModulesFromSOPs(companyId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Company ID required');
      
      // 1. Fetch all SOP templates from default_document_templates
      const { data: templates, error: templatesError } = await supabase
        .from('default_document_templates')
        .select('name, description')
        .ilike('name', 'SOP-%')
        .order('name');
      
      if (templatesError) throw templatesError;
      if (!templates || templates.length === 0) throw new Error('No SOP templates found');
      
      // 2. Fetch existing training modules for this company
      const { data: existing, error: existingError } = await supabase
        .from('training_modules')
        .select('name')
        .eq('company_id', companyId);
      
      if (existingError) throw existingError;
      
      const existingNames = new Set((existing || []).map(m => m.name));
      
      // 3. Filter out already-existing modules
      const newTemplates = templates.filter(t => !existingNames.has(t.name));
      
      if (newTemplates.length === 0) {
        toast.info('All SOPs are already imported');
        return { imported: 0 };
      }
      
      // 4. Bulk insert new training modules
      const modulesToInsert = newTemplates.map(t => ({
        company_id: companyId,
        name: t.name,
        description: t.description || null,
        type: 'sop' as const,
        delivery_method: 'self_paced' as const,
        requires_signature: true,
        version: '1.0',
        is_active: true,
        group_name: getGroupForSOP(t.name),
      }));
      
      const { error: insertError } = await supabase
        .from('training_modules')
        .insert(modulesToInsert);
      
      if (insertError) throw insertError;
      
      return { imported: newTemplates.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-modules', companyId] });
      if (data && data.imported > 0) {
        toast.success(`Imported ${data.imported} SOP training modules`);
      }
    },
    onError: (error) => {
      toast.error('Failed to import SOP modules');
      console.error(error);
    },
  });
}
