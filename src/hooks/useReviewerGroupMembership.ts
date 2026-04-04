import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ReviewerGroupService } from '@/services/reviewerGroupService';

export function useReviewerGroupMembership(companyId?: string) {
  const [isReviewerGroupMember, setIsReviewerGroupMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [userGroupsData, setUserGroupsData] = useState<any[]>([]);
  const { user } = useAuth();
  // console.log('user id', user?.id);
  useEffect(() => {
    const checkMembership = async () => {
      if (!user?.id || !companyId) {
        setIsLoading(false);
        return;
      }

      try {
        const service = new ReviewerGroupService();
        const groups = await service.getCompanyGroups(companyId);
        console.log('groups fetched', groups);
        // Check if current user is a member of any reviewer group
        const memberGroups = groups.filter(group => 
          group.members?.some(member => member.user_id   === user.id)
        );
        console.log('memberGroups', memberGroups);
        setUserGroupsData(memberGroups);
        setIsReviewerGroupMember(memberGroups.length > 0);
        setUserGroups(memberGroups.map(group => group.id));
      } catch (error) {
        console.error('Error checking reviewer group membership:', error);
        setIsReviewerGroupMember(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, [user?.id, companyId]);

  return {
    isReviewerGroupMember,
    isLoading,
    userGroups,
    userGroupsData
  };
}