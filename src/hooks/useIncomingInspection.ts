import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomingInspectionService } from '@/services/incomingInspectionService';
import { toast } from 'sonner';

export const useInspectionsByProduct = (productId: string) => {
  return useQuery({
    queryKey: ['incoming-inspections', 'product', productId],
    queryFn: () => incomingInspectionService.getByProduct(productId),
    enabled: !!productId,
  });
};

export const useInspectionsByCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['incoming-inspections', 'company', companyId],
    queryFn: () => incomingInspectionService.getByCompany(companyId),
    enabled: !!companyId,
  });
};

export const useInspectionById = (id: string) => {
  return useQuery({
    queryKey: ['incoming-inspection', id],
    queryFn: () => incomingInspectionService.getById(id),
    enabled: !!id,
  });
};

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incomingInspectionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-inspections'] });
      toast.success('Inspection record created');
    },
    onError: () => toast.error('Failed to create inspection record'),
  });
};

export const useUpdateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      incomingInspectionService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['incoming-inspection'] });
      toast.success('Inspection updated');
    },
    onError: () => toast.error('Failed to update inspection'),
  });
};

export const useDeleteInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incomingInspectionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-inspections'] });
      toast.success('Inspection deleted');
    },
    onError: () => toast.error('Failed to delete inspection'),
  });
};

export const useInspectionItems = (inspectionId: string) => {
  return useQuery({
    queryKey: ['inspection-items', inspectionId],
    queryFn: () => incomingInspectionService.getItems(inspectionId),
    enabled: !!inspectionId,
  });
};

export const useCreateInspectionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: incomingInspectionService.createItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inspection-items', data.inspection_id] });
      toast.success('Check item added');
    },
    onError: () => toast.error('Failed to add check item'),
  });
};

export const useUpdateInspectionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      incomingInspectionService.updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-items'] });
    },
    onError: () => toast.error('Failed to update check item'),
  });
};
