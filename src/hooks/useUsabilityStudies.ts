import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsabilityStudies,
  createUsabilityStudy,
  updateUsabilityStudy,
  deleteUsabilityStudy,
  UsabilityStudyRow,
} from "@/services/usabilityStudyService";
import { toast } from "sonner";

export function useUsabilityStudies(productId: string, studyType?: 'formative' | 'summative') {
  const queryClient = useQueryClient();
  const queryKey = ['usability-studies', productId, studyType];

  const { data: studies = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getUsabilityStudies(productId, studyType),
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: (study: Partial<UsabilityStudyRow> & { product_id: string; company_id: string; study_type: string }) =>
      createUsabilityStudy(study),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
      toast.success('Study created');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create study'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UsabilityStudyRow> }) =>
      updateUsabilityStudy(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update study'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUsabilityStudy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
      toast.success('Study removed');
    },
    onError: () => toast.error('Failed to delete study'),
  });

  return {
    studies,
    isLoading,
    error,
    createStudy: createMutation.mutate,
    updateStudy: updateMutation.mutate,
    deleteStudy: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
