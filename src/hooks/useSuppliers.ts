import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SupplierService } from "@/services/supplierService";
import type { Supplier } from "@/types/supplier";
import { toast } from "sonner";

export function useSuppliers(companyId: string) {
  return useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: () => SupplierService.getSuppliers(companyId),
    enabled: !!companyId,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => SupplierService.getSupplierById(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) =>
      SupplierService.createSupplier(supplier),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.company_id] });
      toast.success("Supplier created successfully");
    },
    onError: (error) => {
      console.error('Error creating supplier:', error);
      toast.error("Failed to create supplier");
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Supplier> }) =>
      SupplierService.updateSupplier(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.company_id] });
      queryClient.invalidateQueries({ queryKey: ['supplier', data.id] });
      toast.success("Supplier updated successfully");
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
      toast.error("Failed to update supplier");
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => SupplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
      toast.error("Failed to delete supplier");
    },
  });
}

export function useApprovedSuppliers(companyId: string) {
  return useQuery({
    queryKey: ['approved-suppliers', companyId],
    queryFn: () => SupplierService.getApprovedSuppliers(companyId),
    enabled: !!companyId,
  });
}

export function useAvailableSuppliers(companyId: string) {
  return useQuery({
    queryKey: ['available-suppliers', companyId],
    queryFn: () => SupplierService.getAvailableSuppliers(companyId),
    enabled: !!companyId,
  });
}