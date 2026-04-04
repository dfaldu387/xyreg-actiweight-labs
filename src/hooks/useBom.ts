import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BomService } from '@/services/bomService';
import { supabase } from '@/integrations/supabase/client';
import { checkAndAutoEnable } from '@/services/gapAutoEnableService';
import type { CreateBomRevisionData, CreateBomItemData, UpdateBomItemData } from '@/types/bom';
import { toast } from 'sonner';

export function useBomRevisions(productId: string | undefined) {
  return useQuery({
    queryKey: ['bom-revisions', productId],
    queryFn: () => BomService.getRevisions(productId!),
    enabled: !!productId,
  });
}

export function useBomRevision(revisionId: string | undefined) {
  return useQuery({
    queryKey: ['bom-revision', revisionId],
    queryFn: () => BomService.getRevision(revisionId!),
    enabled: !!revisionId,
  });
}

export function useBomItems(revisionId: string | undefined) {
  return useQuery({
    queryKey: ['bom-items', revisionId],
    queryFn: () => BomService.getItems(revisionId!),
    enabled: !!revisionId,
  });
}

export function useBomTransitions(revisionId: string | undefined) {
  return useQuery({
    queryKey: ['bom-transitions', revisionId],
    queryFn: () => BomService.getTransitions(revisionId!),
    enabled: !!revisionId,
  });
}

export function useBomItemChanges(revisionId: string | undefined) {
  return useQuery({
    queryKey: ['bom-item-changes', revisionId],
    queryFn: () => BomService.getItemChanges(revisionId!),
    enabled: !!revisionId,
  });
}

export function useCreateBomRevision(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBomRevisionData) => BomService.createRevision(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-revisions', productId] });
      toast.success('BOM revision created');
    },
    onError: () => toast.error('Failed to create revision'),
  });
}

export function useArchiveBomRevision(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      BomService.archiveRevision(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-revisions', productId] });
      toast.success('Revision archived');
    },
    onError: () => toast.error('Failed to archive revision'),
  });
}

export function useRestoreBomRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BomService.restoreRevision(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archived-bom-revisions'] });
      qc.invalidateQueries({ queryKey: ['bom-revisions'] });
      toast.success('Revision restored');
    },
    onError: () => toast.error('Failed to restore revision'),
  });
}

export function useActivateBomRevision(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ revisionId, userId }: { revisionId: string; userId: string }) =>
      BomService.activateRevision(revisionId, productId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-revisions', productId] });
      toast.success('Revision activated');
    },
    onError: () => toast.error('Failed to activate revision'),
  });
}

export function useCloneBomRevision(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { sourceId: string; newRevision: string; companyId: string; userId: string }) =>
      BomService.cloneRevision(args.sourceId, args.newRevision, productId, args.companyId, args.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-revisions', productId] });
      toast.success('Revision cloned');
    },
    onError: () => toast.error('Failed to clone revision'),
  });
}

export function useAutoCloneForEdit(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { activeRevisionId: string; companyId: string; userId: string }) =>
      BomService.autoCloneForEdit(args.activeRevisionId, productId, args.companyId, args.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-revisions', productId] });
      qc.invalidateQueries({ queryKey: ['ccrs'] });
      toast.success('New draft revision created with linked ECO (CCR)');
    },
    onError: () => toast.error('Failed to create draft revision'),
  });
}

export function useCreateBomItem(revisionId: string, productId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBomItemData) => BomService.createItem(data),
    onSuccess: async (_, variables) => {
      qc.invalidateQueries({ queryKey: ['bom-items', revisionId] });
      qc.invalidateQueries({ queryKey: ['bom-revisions'] });
      toast.success('Item added');

      // Auto-enable gap templates if patient_contact was set
      if (variables.patient_contact && variables.patient_contact !== 'none' && productId) {
        try {
          const { data: product } = await supabase
            .from('products').select('company_id').eq('id', productId).single();
          if (product?.company_id) {
            const enabled = await checkAndAutoEnable(product.company_id);
            if (enabled.length > 0) {
              toast.success(`Auto-enabled: ${enabled.join(', ')}`);
              qc.invalidateQueries({ queryKey: ['enabled-gap-frameworks'] });
            }
          }
        } catch (e) { console.error('Auto-enable check failed:', e); }
      }
    },
    onError: () => toast.error('Failed to add item'),
  });
}

export function useUpdateBomItem(revisionId: string, productId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateBomItemData }) =>
      BomService.updateItem(id, updates, revisionId),
    onSuccess: async (_, variables) => {
      qc.invalidateQueries({ queryKey: ['bom-items', revisionId] });
      qc.invalidateQueries({ queryKey: ['bom-revisions'] });
      toast.success('Item updated');

      // Auto-enable gap templates if patient_contact changed
      if (variables.updates.patient_contact && variables.updates.patient_contact !== 'none' && productId) {
        try {
          const { data: product } = await supabase
            .from('products').select('company_id').eq('id', productId).single();
          if (product?.company_id) {
            const enabled = await checkAndAutoEnable(product.company_id);
            if (enabled.length > 0) {
              toast.success(`Auto-enabled: ${enabled.join(', ')}`);
              qc.invalidateQueries({ queryKey: ['enabled-gap-frameworks'] });
            }
          }
        } catch (e) { console.error('Auto-enable check failed:', e); }
      }
    },
    onError: () => toast.error('Failed to update item'),
  });
}

export function useDeleteBomItem(revisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BomService.deleteItem(id, revisionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-items', revisionId] });
      qc.invalidateQueries({ queryKey: ['bom-revisions'] });
      toast.success('Item removed');
    },
    onError: () => toast.error('Failed to remove item'),
  });
}
