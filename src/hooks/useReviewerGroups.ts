import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReviewerGroup, ReviewerGroupService } from '@/services/reviewerGroupService';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface UseReviewerGroupsOptions {
  enabled?: boolean;
}

export function useReviewerGroups(companyId?: string, options: UseReviewerGroupsOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const queryKey = ['reviewer-groups', companyId];
  const { user } = useAuth();

  const {
    data: reviewerGroups = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ReviewerGroup[]>({
    queryKey,
    queryFn: async () => {
      if (!companyId) return [];
      const service = new ReviewerGroupService();
      return await service.getCompanyGroups(companyId);
    },
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const upsertIntoCache = (updater: (current: ReviewerGroup[]) => ReviewerGroup[]) => {
    queryClient.setQueryData<ReviewerGroup[]>(queryKey, (current = []) => updater(current));
  };

  const createGroup = async (groupData: Partial<ReviewerGroup>): Promise<ReviewerGroup | null> => {
    if (!companyId) {
      toast.error('Company ID is required');
      return null;
    }

    const service = new ReviewerGroupService();
    const newGroup = await service.createGroup({
      ...groupData,
      company_id: companyId
    } as ReviewerGroup, user?.id);

    if (newGroup) {
      upsertIntoCache((current) => [...current, newGroup]);
    }

    return newGroup;
  };

  const updateGroup = async (groupId: string, updates: Partial<ReviewerGroup>): Promise<boolean> => {
    if (!companyId) {
      toast.error('Company ID is required');
      return false;
    }

    const service = new ReviewerGroupService();
    const success = await service.updateGroup(groupId, updates);

    if (success) {
      await queryClient.invalidateQueries({ queryKey });
    }

    return success;
  };

  const deleteGroup = async (groupId: string): Promise<boolean> => {
    const service = new ReviewerGroupService();
    const success = await service.deleteGroup(groupId);

    if (success) {
      upsertIntoCache((current) => current.filter((group) => group.id !== groupId));
    }

    return success;
  };

  const addMember = async (groupId: string, userId: string, memberData: any): Promise<boolean> => {
    if (!companyId) {
      toast.error('Company ID is required');
      return false;
    }

    const service = new ReviewerGroupService();
    const success = await service.addMemberToGroup(groupId, userId, companyId, memberData, user?.id);

    if (success) {
      await refetch();
    }

    return success;
  };

  const removeMember = async (groupId: string, userId: string): Promise<boolean> => {
    if (!companyId) {
      toast.error('Company ID is required');
      return false;
    }

    const service = new ReviewerGroupService();
    const success = await service.removeMemberFromGroup(groupId, userId, companyId);

    if (success) {
      await refetch();
    }

    return success;
  };

  const refetchGroups = () => {
    return refetch();
  };

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : String(error)
    : null;

  return {
    reviewerGroups,
    isLoading,
    isFetching,
    error: errorMessage,
    refetch: refetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    // Legacy properties for backward compatibility
    groups: reviewerGroups,
    fetchGroups: refetchGroups
  };
}