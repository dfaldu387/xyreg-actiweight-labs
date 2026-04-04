import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ncService } from '@/services/nonconformityService';
import { NCStatus } from '@/types/nonconformity';
import { toast } from 'sonner';

// ============ NC RECORDS ============

export function useNCsByCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['ncs', 'company', companyId],
    queryFn: () => ncService.getNCsByCompany(companyId!),
    enabled: !!companyId,
  });
}

export function useNCsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['ncs', 'product', productId],
    queryFn: () => ncService.getNCsByProduct(productId!),
    enabled: !!productId,
  });
}

export function useNCById(ncId: string | undefined) {
  return useQuery({
    queryKey: ['nc', ncId],
    queryFn: () => ncService.getNCById(ncId!),
    enabled: !!ncId,
  });
}

export function useCreateNC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ncService.createNC,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ncs'] });
      toast.success(`NC ${data.nc_id} created successfully`);
    },
    onError: (e: Error) => toast.error(`Failed to create NC: ${e.message}`),
  });
}

export function useUpdateNC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      ncService.updateNC(id, updates),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ncs'] });
      qc.invalidateQueries({ queryKey: ['nc', data.id] });
      toast.success('NC updated');
    },
    onError: (e: Error) => toast.error(`Failed to update NC: ${e.message}`),
  });
}

export function useDeleteNC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ncService.deleteNC,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ncs'] });
      toast.success('NC deleted');
    },
    onError: (e: Error) => toast.error(`Failed to delete NC: ${e.message}`),
  });
}

// ============ STATE TRANSITIONS ============

export function useTransitionNCState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ncId, fromStatus, toStatus, userId, reason,
    }: {
      ncId: string;
      fromStatus: NCStatus | null;
      toStatus: NCStatus;
      userId: string;
      reason?: string;
    }) => ncService.transitionNCState(ncId, fromStatus, toStatus, userId, reason),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['ncs'] });
      qc.invalidateQueries({ queryKey: ['nc', v.ncId] });
      qc.invalidateQueries({ queryKey: ['nc-transitions', v.ncId] });
      toast.success(`NC transitioned to ${v.toStatus}`);
    },
    onError: (e: Error) => toast.error(`Failed to transition NC: ${e.message}`),
  });
}

export function useNCTransitions(ncId: string | undefined) {
  return useQuery({
    queryKey: ['nc-transitions', ncId],
    queryFn: () => ncService.getNCTransitions(ncId!),
    enabled: !!ncId,
  });
}

// ============ EVIDENCE ============

export function useNCEvidence(ncId: string | undefined) {
  return useQuery({
    queryKey: ['nc-evidence', ncId],
    queryFn: () => ncService.getNCEvidence(ncId!),
    enabled: !!ncId,
  });
}

export function useUploadNCEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ncId, file, evidenceType, description, userId }: {
      ncId: string; file: File; evidenceType: string; description?: string; userId: string;
    }) => ncService.uploadNCEvidence(ncId, file, evidenceType, description, userId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['nc-evidence', data.nc_id] });
      toast.success('Evidence uploaded');
    },
    onError: (e: Error) => toast.error(`Upload failed: ${e.message}`),
  });
}

export function useDeleteNCEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath, ncId }: { id: string; storagePath: string; ncId: string }) =>
      ncService.deleteNCEvidence(id, storagePath),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['nc-evidence', v.ncId] });
      toast.success('Evidence deleted');
    },
    onError: (e: Error) => toast.error(`Delete failed: ${e.message}`),
  });
}

// ============ ANALYTICS ============

export function useNCAnalytics(companyId: string | undefined) {
  return useQuery({
    queryKey: ['nc-analytics', companyId],
    queryFn: () => ncService.getNCAnalytics(companyId!),
    enabled: !!companyId,
  });
}
