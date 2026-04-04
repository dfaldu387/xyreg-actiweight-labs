import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseProgressData {
  overallProgress: number;
  documentProgress: number;
  canAdvance: boolean;
  stats: {
    total: number;
    approved: number;
    pending: number;
    overdue: number;
  };
}

/**
 * Batched hook that fetches all documents for a product in a single API call
 * and calculates progress for each phase client-side.
 * This prevents N API calls for N phases.
 */
export function useProductPhasesProgress(productId: string) {
  return useQuery({
    queryKey: ['product-phases-progress', productId],
    queryFn: async () => {
      // Fetch ALL documents for this product in a single query
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('status, due_date, phase_id')
        .eq('product_id', productId);

      if (docError) throw docError;

      // Group documents by phase_id
      const documentsByPhase = new Map<string, typeof documents>();

      documents?.forEach(doc => {
        if (!doc.phase_id) return;
        const existing = documentsByPhase.get(doc.phase_id) || [];
        existing.push(doc);
        documentsByPhase.set(doc.phase_id, existing);
      });

      // Calculate progress for each phase
      const progressByPhase = new Map<string, PhaseProgressData>();
      const today = new Date();

      documentsByPhase.forEach((phaseDocs, phaseId) => {
        const totalDocs = phaseDocs.length;

        const approvedDocs = phaseDocs.filter(d => d.status === 'Approved').length;
        const pendingDocs = phaseDocs.filter(d => d.status && !['Approved', 'Rejected', 'Archived'].includes(d.status)).length;
        const overdueDocs = phaseDocs.filter(d => {
          if (!d.due_date) return false;
          return new Date(d.due_date) < today && d.status !== 'Approved';
        }).length;

        const documentProgress = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
        const overallProgress = documentProgress;
        const canAdvance = documentProgress >= 80 && overdueDocs === 0;

        progressByPhase.set(phaseId, {
          overallProgress,
          documentProgress,
          canAdvance,
          stats: {
            total: totalDocs,
            approved: approvedDocs,
            pending: pendingDocs,
            overdue: overdueDocs
          }
        });
      });

      return progressByPhase;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Helper hook to get progress for a specific phase from the batched data
 */
export function usePhaseProgressFromBatch(
  phaseId: string,
  productId: string,
  batchedData: Map<string, PhaseProgressData> | undefined
): PhaseProgressData | undefined {
  if (!batchedData || !phaseId) return undefined;
  return batchedData.get(phaseId);
}
