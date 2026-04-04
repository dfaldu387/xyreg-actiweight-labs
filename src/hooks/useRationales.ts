import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  generateRationale,
  generateDocumentId,
  createProcessValidationRationale,
  getProcessValidationRationales,
  updateProcessValidationRationale,
  deleteProcessValidationRationale,
  createSupplierCriticalityRationale,
  getSupplierCriticalityRationales,
  getSupplierCriticalityRationale,
  updateSupplierCriticalityRationale,
  deleteSupplierCriticalityRationale,
} from '@/services/rationaleService';
import type {
  ProcessValidationRationale,
  SupplierCriticalityRationale,
  ValidationRationaleContext,
  SupplierRationaleContext,
} from '@/types/riskBasedRationale';

// Generate AI rationale - supports all RBR types
export function useGenerateRationale() {
  return useMutation({
    mutationFn: async ({
      type,
      context,
      companyId,
    }: {
      type: 'validation' | 'supplier' | 'sample_size' | 'design_change' | 'capa_priority' | 'pathway' | 'clinical' | 'software' | 'training';
      context: any; // Accept any context type - validated by edge function
      companyId: string;
    }) => {
      return generateRationale(type, context, companyId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate rationale: ${error.message}`);
    },
  });
}

// Process Validation Rationales
export function useProcessValidationRationales(companyId: string, productId?: string) {
  return useQuery({
    queryKey: ['process-validation-rationales', companyId, productId],
    queryFn: () => getProcessValidationRationales(companyId, productId),
    enabled: !!companyId,
  });
}

export function useCreateProcessValidationRationale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rationale: Omit<ProcessValidationRationale, 'id' | 'created_at' | 'updated_at'>) => {
      return createProcessValidationRationale(rationale);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['process-validation-rationales'] });
      toast.success('Validation rationale created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rationale: ${error.message}`);
    },
  });
}

export function useUpdateProcessValidationRationale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ProcessValidationRationale>;
    }) => {
      return updateProcessValidationRationale(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-validation-rationales'] });
      toast.success('Validation rationale updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update rationale: ${error.message}`);
    },
  });
}

export function useDeleteProcessValidationRationale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProcessValidationRationale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-validation-rationales'] });
      toast.success('Validation rationale deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete rationale: ${error.message}`);
    },
  });
}

// Supplier Criticality Rationales
export function useSupplierCriticalityRationales(companyId: string, supplierId?: string) {
  return useQuery({
    queryKey: ['supplier-criticality-rationales', companyId, supplierId],
    queryFn: () => getSupplierCriticalityRationales(companyId, supplierId),
    enabled: !!companyId,
  });
}

export function useSupplierCriticalityRationale(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-criticality-rationale', supplierId],
    queryFn: () => getSupplierCriticalityRationale(supplierId),
    enabled: !!supplierId,
  });
}

export function useCreateSupplierCriticalityRationale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rationale: Omit<SupplierCriticalityRationale, 'id' | 'created_at' | 'updated_at'>) => {
      return createSupplierCriticalityRationale(rationale);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-criticality-rationales'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-criticality-rationale'] });
      toast.success('Supplier rationale created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rationale: ${error.message}`);
    },
  });
}

export function useUpdateSupplierCriticalityRationale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SupplierCriticalityRationale>;
    }) => {
      return updateSupplierCriticalityRationale(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-criticality-rationales'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-criticality-rationale'] });
      toast.success('Supplier rationale updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update rationale: ${error.message}`);
    },
  });
}

export function useDeleteSupplierCriticalityRationale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSupplierCriticalityRationale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-criticality-rationales'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-criticality-rationale'] });
      toast.success('Supplier rationale deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete rationale: ${error.message}`);
    },
  });
}

// Generate document ID
export function useGenerateDocumentId() {
  return useMutation({
    mutationFn: async ({
      prefix,
      companyId,
    }: {
      prefix: 'RBR-ENG' | 'RBR-SUP';
      companyId: string;
    }) => {
      return generateDocumentId(prefix, companyId);
    },
  });
}
