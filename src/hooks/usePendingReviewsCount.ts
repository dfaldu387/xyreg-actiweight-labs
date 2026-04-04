import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useUserReviewerGroups } from '@/hooks/useUserReviewerGroups';

export function usePendingReviewsCount() {
  const { user } = useAuth();
  const companyId = useCompanyId();

  // Use shared hook for reviewer group memberships (cached)
  const { groupIds, isLoading: groupsLoading } = useUserReviewerGroups();

  const {
    data: pendingCount = 0,
    isLoading: countLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pending-reviews-count', user?.id, companyId, groupIds],
    queryFn: async (): Promise<number> => {
      if (!user?.id || !companyId) {
        return 0;
      }

      if (groupIds.length === 0) {
        return 0;
      }

      const ACTIONABLE_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested'];

      try {
        // Get phase-assigned documents that actually need review action
        const { data: allDocuments, error: docsError } = await supabase
          .from('phase_assigned_document_template')
          .select('id, reviewer_group_ids, status, company_phases!inner(company_id)')
          .eq('company_phases.company_id', companyId)
          .overlaps('reviewer_group_ids', groupIds)
          .eq('is_excluded', false)
          .in('status', ACTIONABLE_STATUSES);

        if (docsError) {
          console.error('[usePendingReviewsCount] Error fetching documents:', docsError);
          throw docsError;
        }

        // Fetch regular documents that actually need review action
        const { data: regularDocs, error: regError } = await supabase
          .from('documents')
          .select('id, reviewer_group_ids, company_id')
          .eq('company_id', companyId)
          .overlaps('reviewer_group_ids', groupIds)
          .in('status', ACTIONABLE_STATUSES);

        if (regError) {
          console.error('[usePendingReviewsCount] Error fetching regular documents:', regError);
          throw regError;
        }

        // Combine both sources and count all documents
        const totalCount = (allDocuments?.length || 0) + (regularDocs?.length || 0);

        return totalCount;
      } catch (error) {
        console.error('[usePendingReviewsCount] Error:', error);
        return 0;
      }
    },
    enabled: !!user?.id && !!companyId && groupIds.length > 0,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes - data is fresh for 2 min
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 60000, // Refetch every 60 seconds (reduced from 30)
  });

  const isLoading = groupsLoading || countLoading;

  return {
    pendingCount,
    isLoading,
    error,
    refetch
  };
}
