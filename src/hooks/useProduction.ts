import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService } from '@/services/productionService';
import { toast } from 'sonner';

export const useProductionOrdersByProduct = (productId: string) => {
  return useQuery({
    queryKey: ['production-orders', 'product', productId],
    queryFn: () => productionService.getByProduct(productId),
    enabled: !!productId,
  });
};

export const useProductionOrdersByCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['production-orders', 'company', companyId],
    queryFn: () => productionService.getByCompany(companyId),
    enabled: !!companyId,
  });
};

export const useProductionOrderById = (id: string) => {
  return useQuery({
    queryKey: ['production-order', id],
    queryFn: () => productionService.getById(id),
    enabled: !!id,
  });
};

export const useCreateProductionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('Production order created');
    },
    onError: () => toast.error('Failed to create production order'),
  });
};

export const useUpdateProductionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      productionService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['production-order'] });
      toast.success('Production order updated');
    },
    onError: () => toast.error('Failed to update production order'),
  });
};

export const useDeleteProductionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('Production order deleted');
    },
    onError: () => toast.error('Failed to delete production order'),
  });
};

export const useProductionCheckpoints = (orderId: string) => {
  return useQuery({
    queryKey: ['production-checkpoints', orderId],
    queryFn: () => productionService.getCheckpoints(orderId),
    enabled: !!orderId,
  });
};

export const useCreateProductionCheckpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionService.createCheckpoint,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-checkpoints', data.order_id] });
      toast.success('Checkpoint added');
    },
    onError: () => toast.error('Failed to add checkpoint'),
  });
};

export const useUpdateProductionCheckpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      productionService.updateCheckpoint(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-checkpoints'] });
    },
    onError: () => toast.error('Failed to update checkpoint'),
  });
};
