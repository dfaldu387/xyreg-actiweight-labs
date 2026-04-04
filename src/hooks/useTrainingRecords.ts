import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrainingRecord, TrainingStatus, UserTrainingStats } from '@/types/training';
import { toast } from 'sonner';
import { isValidUUID } from '@/utils/uuidValidation';

export function useUserTrainingRecords(userId: string | undefined, companyId: string | undefined) {
  return useQuery({
    queryKey: ['training-records', 'user', userId, companyId],
    queryFn: async () => {
      if (!isValidUUID(userId) || !isValidUUID(companyId)) return [];
      
      const { data, error } = await supabase
        .from('training_records')
        .select(`
          *,
          training_module:training_modules(*)
        `)
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .order('due_date', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as unknown as TrainingRecord[];
    },
    enabled: isValidUUID(userId) && isValidUUID(companyId),
  });
}

export function useCompanyTrainingRecords(companyId: string | undefined) {
  return useQuery({
    queryKey: ['training-records', 'company', companyId],
    queryFn: async () => {
      if (!isValidUUID(companyId)) return [];
      
      const { data, error } = await supabase
        .from('training_records')
        .select(`
          *,
          training_module:training_modules(*)
        `)
        .eq('company_id', companyId)
        .order('due_date', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as unknown as TrainingRecord[];
    },
    enabled: isValidUUID(companyId),
  });
}

export function useUserTrainingStats(userId: string | undefined, companyId: string | undefined) {
  const { data: records } = useUserTrainingRecords(userId, companyId);
  
  const stats: UserTrainingStats = {
    total: 0,
    completed: 0,
    in_progress: 0,
    overdue: 0,
    upcoming: 0,
    completionRate: 0,
  };
  
  if (records) {
    stats.total = records.length;
    stats.completed = records.filter(r => r.status === 'completed').length;
    stats.in_progress = records.filter(r => r.status === 'in_progress' || r.status === 'scheduled').length;
    stats.overdue = records.filter(r => r.status === 'overdue').length;
    stats.upcoming = records.filter(r => r.status === 'not_started').length;
    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100;
  }
  
  return stats;
}

export function useUpdateTrainingRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      signature_data, 
      completion_notes,
      scheduled_session_date,
    }: { 
      id: string; 
      status?: TrainingStatus;
      signature_data?: object;
      completion_notes?: string;
      scheduled_session_date?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      
      if (status) {
        updates.status = status;
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        } else if (status === 'in_progress' && !updates.started_at) {
          updates.started_at = new Date().toISOString();
        }
      }
      
      if (signature_data) updates.signature_data = signature_data;
      if (completion_notes) updates.completion_notes = completion_notes;
      if (scheduled_session_date) updates.scheduled_session_date = scheduled_session_date;
      
      const { data, error } = await supabase
        .from('training_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] });
      toast.success('Training record updated');
    },
    onError: (error) => {
      toast.error('Failed to update training record');
      console.error(error);
    },
  });
}

export function useCompleteTraining() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      recordId, 
      signature,
      notes 
    }: { 
      recordId: string;
      signature?: boolean;
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      };
      
      if (signature) {
        updates.signature_data = {
          signedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
        };
      }
      
      if (notes) updates.completion_notes = notes;
      
      const { data, error } = await supabase
        .from('training_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] });
      toast.success('Training completed!');
    },
    onError: (error) => {
      toast.error('Failed to complete training');
      console.error(error);
    },
  });
}
