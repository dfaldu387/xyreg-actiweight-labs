import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DeviceComponentsService, type CreateDeviceComponentData, type UpdateDeviceComponentData } from '@/services/deviceComponentsService';
import { toast } from 'sonner';

export function useDeviceComponents(productId: string | undefined) {
  return useQuery({
    queryKey: ['device-components', productId],
    queryFn: () => DeviceComponentsService.getByProduct(productId!),
    enabled: !!productId,
  });
}

export function useDeviceComponentTree(productId: string | undefined) {
  const query = useDeviceComponents(productId);
  const tree = useMemo(
    () => query.data ? DeviceComponentsService.buildTree(query.data) : [],
    [query.data]
  );
  return { ...query, tree };
}

export function useCreateDeviceComponent(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeviceComponentData) => DeviceComponentsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device-components', productId] });
      toast.success('Component added');
    },
    onError: () => toast.error('Failed to add component'),
  });
}

export function useUpdateDeviceComponent(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateDeviceComponentData }) =>
      DeviceComponentsService.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device-components', productId] });
      toast.success('Component updated');
    },
    onError: () => toast.error('Failed to update component'),
  });
}

export function useDeleteDeviceComponent(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DeviceComponentsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device-components', productId] });
      toast.success('Component removed');
    },
    onError: () => toast.error('Failed to remove component'),
  });
}

export function useSetComponentFeatures(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, featureNames }: { componentId: string; featureNames: string[] }) =>
      DeviceComponentsService.setLinkedFeatures(componentId, featureNames),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device-components', productId] });
    },
    onError: () => toast.error('Failed to update feature links'),
  });
}
