import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePhaseProgress(phaseId: string, productId: string) {
  return useQuery({
    queryKey: ['phase-progress', phaseId, productId],
    queryFn: async () => {
      // Fetch documents for this phase
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('status, due_date')
        .eq('product_id', productId)
        .eq('phase_id', phaseId);

      if (docError) throw docError;

      const totalDocs = documents?.length || 0;
      const today = new Date();
      
      // Status can be: Draft, In Review, Approved, Rejected, Archived, etc.
      const approvedDocs = documents?.filter(d => d.status === 'Approved').length || 0;
      const pendingDocs = documents?.filter(d => d.status && !['Approved', 'Rejected', 'Archived'].includes(d.status)).length || 0;
      const overdueDocs = documents?.filter(d => {
        if (!d.due_date) return false;
        return new Date(d.due_date) < today && d.status !== 'Approved';
      }).length || 0;

      const documentProgress = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

      // Overall progress based on documents
      const overallProgress = documentProgress;

      // Can advance if >80% documents approved and no overdue items
      const canAdvance = documentProgress >= 80 && overdueDocs === 0;

      return {
        overallProgress,
        documentProgress,
        canAdvance,
        stats: {
          total: totalDocs,
          approved: approvedDocs,
          pending: pendingDocs,
          overdue: overdueDocs
        }
      };
    },
    enabled: !!phaseId && !!productId
  });
}
