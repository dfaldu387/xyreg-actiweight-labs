import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface UserReviewerGroupMembership {
  group_id: string;
  role: string;
  is_lead: boolean;
  can_approve: boolean;
  is_active: boolean;
}

/**
 * Hook to fetch and cache user's reviewer group memberships.
 * Uses React Query to share data across components and prevent duplicate API calls.
 */
export function useUserReviewerGroups() {
  const { user } = useAuth();

  const { data: memberships = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-reviewer-groups', user?.id],
    queryFn: async (): Promise<UserReviewerGroupMembership[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('reviewer_group_members_new')
        .select('group_id, role, is_lead, can_approve, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('[useUserReviewerGroups] Error fetching memberships:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const groupIds = memberships.map(m => m.group_id);

  return {
    memberships,
    groupIds,
    isLoading,
    error,
    refetch,
    isMemberOfGroup: (groupId: string) => groupIds.includes(groupId),
  };
}
