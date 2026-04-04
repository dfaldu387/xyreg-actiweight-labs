import React from 'react';
import { useSiblingGroups, useUpdateSiblingGroup, useDeleteSiblingGroup } from '@/hooks/useSiblingGroups';
import { SiblingGroupCard } from '../variants/SiblingGroupCard';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SiblingGroupManagerProps {
  companyId: string;
  basicUdiDi: string;
}

export function SiblingGroupManager({ companyId, basicUdiDi }: SiblingGroupManagerProps) {
  const { data: siblingGroupsData, isLoading } = useSiblingGroups(basicUdiDi);
  const updateGroupMutation = useUpdateSiblingGroup();
  const deleteGroupMutation = useDeleteSiblingGroup();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading groups...</div>;
  }

  if (!siblingGroupsData || siblingGroupsData.length === 0) {
    return null;
  }

  const handleDelete = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync({ id: groupId, basicUdiDi, companyId });
      queryClient.invalidateQueries({ queryKey: ['company-basic-udi-groups', companyId] });
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleUpdateDistributionPattern = async (groupId: string, pattern: any) => {
    try {
      await updateGroupMutation.mutateAsync({
        id: groupId,
        basicUdiDi,
        companyId,
        data: { distribution_pattern: pattern },
      });
      queryClient.invalidateQueries({ queryKey: ['company-basic-udi-groups', companyId] });
    } catch (error) {
      console.error('Failed to update distribution pattern:', error);
    }
  };

  return (
    <div className="space-y-3">
      {siblingGroupsData.map((group) => {
        // Transform assignments to siblings format with product data, sorted by position
        const siblings = group.product_sibling_assignments
          .map((assignment: any) => ({
            assignmentId: assignment.id,
            productId: assignment.product_id,
            name: assignment.product?.name || assignment.product_id,
            tradeName: assignment.product?.trade_name || null,
            percentage: assignment.percentage || 0,
            position: assignment.position || 0,
          }))
          .sort((a, b) => a.position - b.position);

        return (
          <SiblingGroupCard
            key={group.id}
            groupId={group.id}
            groupName={group.name}
            groupDescription={group.description}
            distributionPattern={group.distribution_pattern}
            siblings={siblings}
            onDelete={() => handleDelete(group.id)}
            onUpdateDistributionPattern={(pattern) => 
              handleUpdateDistributionPattern(group.id, pattern)
            }
            basicUdiDi={basicUdiDi}
            companyId={companyId}
          />
        );
      })}
    </div>
  );
}
