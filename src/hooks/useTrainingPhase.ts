import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as svc from '@/services/trainingPhaseService';
import type { TrainingQuizQuestion } from '@/types/training';
import { toast } from 'sonner';

export function useQuizQuestions(moduleId: string | undefined) {
  return useQuery({
    queryKey: ['training-quiz-questions', moduleId],
    queryFn: async (): Promise<TrainingQuizQuestion[]> => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('training_quiz_questions' as any)
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any;
    },
    enabled: !!moduleId,
  });
}

export function useStartReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => svc.startReading(recordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-records'] }),
  });
}

export function useHeartbeatRead() {
  return useMutation({
    mutationFn: (p: { recordId: string; addedSeconds: number }) =>
      svc.heartbeatRead(p.recordId, p.addedSeconds),
  });
}

export function useCompleteReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { recordId: string; requiresQuiz: boolean }) =>
      svc.completeReading(p.recordId, p.requiresQuiz),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-records'] }),
  });
}

export function useSubmitQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.submitQuizAttempt,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['training-records'] });
      if (res.passed) toast.success(`Passed (${res.score}%)`);
      else toast.error(`Failed (${res.score}%) — review and retry`);
    },
  });
}

export function useSignAndComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.signAndComplete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-records'] });
      toast.success('Training completed and signed');
    },
    onError: (e: any) => toast.error(e?.message || 'Sign failed'),
  });
}

export function useGenerateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-training-quiz', {
        body: { module_id: moduleId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, moduleId) => {
      qc.invalidateQueries({ queryKey: ['training-quiz-questions', moduleId] });
      toast.success('Quiz generated');
    },
    onError: (e: any) => toast.error(e?.message || 'Quiz generation failed'),
  });
}