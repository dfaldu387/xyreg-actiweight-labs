import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUsabilityEngineeringFile, 
  createUsabilityEngineeringFile, 
  updateUsabilityEngineeringFile,
  UsabilityEngineeringFile 
} from "@/services/usabilityEngineeringService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function useUsabilityEngineeringFile(productId: string, companyId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = ['usability-engineering-file', productId];

  const { data: uef, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getUsabilityEngineeringFile(productId),
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return createUsabilityEngineeringFile(productId, companyId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Usability Engineering File created');
    },
    onError: (error) => {
      console.error('Error creating UEF:', error);
      toast.error('Failed to create Usability Engineering File');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UsabilityEngineeringFile>) => {
      if (!uef?.id) throw new Error('UEF not found');
      return updateUsabilityEngineeringFile(uef.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Usability Engineering File updated');
    },
    onError: (error) => {
      console.error('Error updating UEF:', error);
      toast.error('Failed to update Usability Engineering File');
    },
  });

  return {
    uef,
    isLoading,
    error,
    createUEF: createMutation.mutate,
    updateUEF: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
