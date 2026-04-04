import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiblingGroupCard, SiblingInGroup } from "@/components/product/variants/SiblingGroupCard";
import { useDeleteSiblingGroup, useUpdateSiblingGroup } from "@/hooks/useSiblingGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { DistributionPattern } from "@/types/siblingGroup";

interface SiblingGroupCardWrapperProps {
  groupId: string;
  companyId: string;
}

export function SiblingGroupCardWrapper({ groupId, companyId }: SiblingGroupCardWrapperProps) {
  const queryClient = useQueryClient();
  const deleteSiblingGroup = useDeleteSiblingGroup();
  const updateSiblingGroup = useUpdateSiblingGroup();

  const { data: groupData, isLoading } = useQuery({
    queryKey: ["sibling-group-detail", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_sibling_groups")
        .select(`
          *,
          product_sibling_assignments (
            id,
            product_id,
            percentage,
            position,
            products (
              id,
              name,
              trade_name
            )
          )
        `)
        .eq("id", groupId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!groupData) return;
    try {
      await deleteSiblingGroup.mutateAsync({
        id: groupId,
        basicUdiDi: groupData.basic_udi_di,
        companyId,
      });
      queryClient.invalidateQueries({ queryKey: ["company-basic-udi-groups", companyId] });
      toast.success("Sibling group deleted");
    } catch (error) {
      console.error("Error deleting sibling group:", error);
      toast.error("Failed to delete sibling group");
    }
  };

  const handleUpdateDistributionPattern = async (pattern: DistributionPattern) => {
    if (!groupData) return;
    try {
      await updateSiblingGroup.mutateAsync({
        id: groupId,
        basicUdiDi: groupData.basic_udi_di,
        companyId,
        data: {
          distribution_pattern: pattern,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["sibling-group-detail", groupId] });
      toast.success("Distribution pattern updated");
    } catch (error) {
      console.error("Error updating distribution pattern:", error);
      toast.error("Failed to update distribution pattern");
    }
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!groupData) {
    return null;
  }

  const siblings: SiblingInGroup[] = (groupData.product_sibling_assignments || [])
    .map((assignment: any) => ({
      assignmentId: assignment.id,
      productId: assignment.product_id,
      name: assignment.products?.name || "Unknown",
      tradeName: assignment.products?.trade_name,
      percentage: assignment.percentage,
      position: assignment.position,
    }))
    .sort((a, b) => a.position - b.position);

  return (
    <SiblingGroupCard
      groupId={groupId}
      groupName={groupData.name}
      groupDescription={groupData.description}
      distributionPattern={groupData.distribution_pattern as DistributionPattern}
      siblings={siblings}
      onDelete={handleDelete}
      onUpdateDistributionPattern={handleUpdateDistributionPattern}
      basicUdiDi={groupData.basic_udi_di}
      companyId={companyId}
    />
  );
}
