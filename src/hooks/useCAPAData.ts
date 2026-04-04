import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { capaService } from '@/services/capaService';
import { CAPARecord, CAPAAction, CAPAEvidence, CAPAStatus } from '@/types/capa';
import { toast } from 'sonner';

// ============================================
// CAPA RECORDS HOOKS
// ============================================

export function useCAPAsByCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['capas', 'company', companyId],
    queryFn: () => capaService.getCAPAsByCompany(companyId!),
    enabled: !!companyId,
  });
}

export function useCAPAsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['capas', 'product', productId],
    queryFn: () => capaService.getCAPAsByProduct(productId!),
    enabled: !!productId,
  });
}

export function useCAPAById(capaId: string | undefined) {
  return useQuery({
    queryKey: ['capa', capaId],
    queryFn: () => capaService.getCAPAById(capaId!),
    enabled: !!capaId,
  });
}

export function useCreateCAPA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: capaService.createCAPA,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
      toast.success(`CAPA ${data.capa_id} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create CAPA: ${error.message}`);
    },
  });
}

export function useUpdateCAPA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CAPARecord> }) =>
      capaService.updateCAPA(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
      queryClient.invalidateQueries({ queryKey: ['capa', data.id] });
      toast.success('CAPA updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update CAPA: ${error.message}`);
    },
  });
}

export function useDeleteCAPA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: capaService.deleteCAPA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
      toast.success('CAPA deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete CAPA: ${error.message}`);
    },
  });
}

// ============================================
// STATE TRANSITION HOOKS
// ============================================

export function useTransitionCAPAState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      capaId,
      fromStatus,
      toStatus,
      userId,
      reason,
    }: {
      capaId: string;
      fromStatus: CAPAStatus | null;
      toStatus: CAPAStatus;
      userId: string;
      reason?: string;
    }) => capaService.transitionCAPAState(capaId, fromStatus, toStatus, userId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
      queryClient.invalidateQueries({ queryKey: ['capa', variables.capaId] });
      queryClient.invalidateQueries({ queryKey: ['capa-transitions', variables.capaId] });
      toast.success(`CAPA transitioned to ${variables.toStatus}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to transition CAPA: ${error.message}`);
    },
  });
}

export function useCAPATransitions(capaId: string | undefined) {
  return useQuery({
    queryKey: ['capa-transitions', capaId],
    queryFn: () => capaService.getCAPATransitions(capaId!),
    enabled: !!capaId,
  });
}

// ============================================
// CAPA ACTIONS HOOKS
// ============================================

export function useCAPAActions(capaId: string | undefined) {
  return useQuery({
    queryKey: ['capa-actions', capaId],
    queryFn: () => capaService.getCAPAActions(capaId!),
    enabled: !!capaId,
  });
}

export function useCreateCAPAAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: Omit<CAPAAction, 'id' | 'created_at' | 'updated_at'>) =>
      capaService.createCAPAAction(action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['capa-actions', data.capa_id] });
      toast.success('Action added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add action: ${error.message}`);
    },
  });
}

export function useUpdateCAPAAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CAPAAction> }) =>
      capaService.updateCAPAAction(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['capa-actions', data.capa_id] });
      toast.success('Action updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update action: ${error.message}`);
    },
  });
}

export function useDeleteCAPAAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, capaId }: { id: string; capaId: string }) =>
      capaService.deleteCAPAAction(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capa-actions', variables.capaId] });
      toast.success('Action deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete action: ${error.message}`);
    },
  });
}

// ============================================
// CAPA EVIDENCE HOOKS
// ============================================

export function useCAPAEvidence(capaId: string | undefined) {
  return useQuery({
    queryKey: ['capa-evidence', capaId],
    queryFn: () => capaService.getCAPAEvidence(capaId!),
    enabled: !!capaId,
  });
}

export function useUploadCAPAEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      capaId,
      file,
      evidenceType,
      description,
      userId,
    }: {
      capaId: string;
      file: File;
      evidenceType: CAPAEvidence['evidence_type'];
      description?: string;
      userId: string;
    }) => capaService.uploadCAPAEvidence(capaId, file, evidenceType, description, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['capa-evidence', data.capa_id] });
      toast.success('Evidence uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload evidence: ${error.message}`);
    },
  });
}

export function useDeleteCAPAEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, storagePath, capaId }: { id: string; storagePath: string; capaId: string }) =>
      capaService.deleteCAPAEvidence(id, storagePath),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capa-evidence', variables.capaId] });
      toast.success('Evidence deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete evidence: ${error.message}`);
    },
  });
}

// ============================================
// ANALYTICS HOOKS
// ============================================

export function useCAPAAnalytics(companyId: string | undefined) {
  return useQuery({
    queryKey: ['capa-analytics', companyId],
    queryFn: () => capaService.getCAPAAnalytics(companyId!),
    enabled: !!companyId,
  });
}

export function useCAPAAnalyticsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['capa-analytics-product', productId],
    queryFn: () => capaService.getCAPAAnalyticsByProduct(productId!),
    enabled: !!productId,
  });
}
