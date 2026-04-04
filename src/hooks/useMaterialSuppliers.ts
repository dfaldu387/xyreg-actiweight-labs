import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialSupplierService } from '@/services/materialSupplierService';
import { CreateMaterialSupplierData, UpdateMaterialSupplierData } from '@/types/materialSupplier';
import { toast } from 'sonner';

export const useMaterialSuppliers = (materialId: string) => {
  return useQuery({
    queryKey: ['material-suppliers', materialId],
    queryFn: () => MaterialSupplierService.getMaterialSuppliers(materialId),
    enabled: !!materialId,
  });
};

export const useSupplierMaterials = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier-materials', supplierId],
    queryFn: () => MaterialSupplierService.getSupplierMaterials(supplierId),
    enabled: !!supplierId,
  });
};

export const useCreateMaterialSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMaterialSupplierData) => MaterialSupplierService.createMaterialSupplier(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['material-suppliers', data.material_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-materials', data.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['company-material-suppliers'] });
      toast.success('Supplier linked to material successfully');
    },
    onError: () => {
      toast.error('Failed to link supplier to material');
    },
  });
};

export const useUpdateMaterialSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateMaterialSupplierData }) =>
      MaterialSupplierService.updateMaterialSupplier(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['material-suppliers', data.material_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-materials', data.supplier_id] });
      queryClient.invalidateQueries({ queryKey: ['company-material-suppliers'] });
      toast.success('Material supplier updated successfully');
    },
    onError: () => {
      toast.error('Failed to update material supplier');
    },
  });
};

export const useDeleteMaterialSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: MaterialSupplierService.deleteMaterialSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-materials'] });
      queryClient.invalidateQueries({ queryKey: ['company-material-suppliers'] });
      toast.success('Supplier unlinked from material successfully');
    },
    onError: () => {
      toast.error('Failed to unlink supplier from material');
    },
  });
};

export const useSetPrimarySupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ materialId, supplierId }: { materialId: string; supplierId: string }) =>
      MaterialSupplierService.setPrimarySupplier(materialId, supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-suppliers'] });
      toast.success('Primary supplier updated successfully');
    },
    onError: () => {
      toast.error('Failed to update primary supplier');
    },
  });
};

export const useCompanyMaterialSuppliers = (companyId: string) => {
  return useQuery({
    queryKey: ['company-material-suppliers', companyId],
    queryFn: () => MaterialSupplierService.getCompanyMaterialSuppliers(companyId),
    enabled: !!companyId,
  });
};

export const useSupplierMaterialCounts = (companyId: string) => {
  return useQuery({
    queryKey: ['supplier-material-counts', companyId],
    queryFn: () => MaterialSupplierService.getMaterialCountsBySupplier(companyId),
    enabled: !!companyId,
  });
};