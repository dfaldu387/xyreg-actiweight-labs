import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReviewerNotificationService } from '@/services/reviewerNotificationService';
import type {
  ReviewWorkflow,
  ReviewWorkflowStage,
  ReviewAssignment,
  ReviewDecisionRecord,
  CreateWorkflowRequest,
  WorkflowProgress,
  ReviewRecordType
} from '@/types/review';
import { ReviewerGroup } from '@/types/reviewerGroups';
import { useAuth } from '@/context/AuthContext';

interface UseReviewWorkflowsOptions {
  enabled?: boolean;
}

export function useReviewWorkflows(
  recordType?: ReviewRecordType, 
  recordId?: string, 
  companyId?: string,
  options: UseReviewWorkflowsOptions = {}
) {
  const { enabled = false } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isRecordSpecified = Boolean(recordType && recordId) && enabled;

  const workflowsQueryKey = useMemo(
    () => ['review-workflows', recordType, recordId],
    [recordType, recordId]
  );

  const reviewerGroupsQueryKey = useMemo(
    () => ['reviewer-groups-for-record', recordType, recordId, companyId],
    [recordType, recordId, companyId]
  );

  const normalizeReviewerGroup = (group: any): ReviewerGroup => ({
    ...group,
    group_type: group.group_type as 'internal' | 'external' | 'regulatory',
    color: group.color || '#3b82f6',
    is_default: group.is_default || false,
    description: group.description || undefined,
    created_by: group.created_by || undefined,
    permissions: (group.permissions || {
      canDownload: true,
      canComment: true,
      canUpload: false,
      canApprove: false,
      canViewInternal: false,
    }) as ReviewerGroup['permissions'],
    settings: (group.settings || {
      requireAllApprovals: false,
      allowSelfAssignment: true,
      enableNotifications: true,
      defaultDeadlineDays: 7,
    }) as ReviewerGroup['settings'],
    members: (group.reviewer_group_members_new || group.members || []).map((member: any) => ({
      ...member,
      name: member.user_profiles
        ? `${member.user_profiles.first_name || ''} ${member.user_profiles.last_name || ''}`.trim()
        : member.name || 'Unknown User',
      email: member.user_profiles?.email || member.email,
      avatar_url: member.user_profiles?.avatar_url || member.avatar_url,
    })),
  });

  const fetchReviewerGroupsForGapItem = async (): Promise<ReviewerGroup[]> => {
    if (!recordId) return [];

    const { data: workflows, error: workflowsError } = await supabase
      .from('review_workflows')
      .select('id')
      .eq('record_type', 'gap_analysis_item')
      .eq('record_id', recordId);

    if (workflowsError) throw workflowsError;
    if (!workflows?.length) return [];

    const workflowIds = workflows.map((workflow) => workflow.id);

    const { data: assignments, error: assignmentsError } = await supabase
      .from('review_assignments')
      .select('reviewer_group_id')
      .in('workflow_id', workflowIds);

    if (assignmentsError) throw assignmentsError;

    const reviewerGroupIds = [...new Set((assignments || []).map((assignment) => assignment.reviewer_group_id))];
    if (!reviewerGroupIds.length) return [];

    const { data: reviewerGroups, error: reviewerGroupsError } = await supabase
      .from('reviewer_groups')
      .select('*')
      .in('id', reviewerGroupIds);

    if (reviewerGroupsError) throw reviewerGroupsError;
    return (reviewerGroups || []).map(normalizeReviewerGroup);
  };

  const fetchReviewerGroupsForDocument = async (): Promise<ReviewerGroup[]> => {
    if (!recordId) return [];

    const cleanRecordId = recordId.replace('template-', '');
    const { data, error } = await supabase
      .from('phase_assigned_document_template')
      .select('reviewer_group_ids')
      .eq('id', cleanRecordId)
      .maybeSingle();

    if (error) throw error;
    const reviewerGroupIds = data?.reviewer_group_ids as string[] | undefined;
    if (!reviewerGroupIds?.length) return [];

    const { data: reviewerGroups, error: reviewerGroupsError } = await supabase
      .from('reviewer_groups')
      .select('*')
      .in('id', reviewerGroupIds);

    if (reviewerGroupsError) throw reviewerGroupsError;
    return (reviewerGroups || []).map(normalizeReviewerGroup);
  };

  const {
    data: workflowsData = [],
    isLoading: workflowsLoading,
    isFetching: workflowsFetching,
    error: workflowsError,
    refetch: refetchWorkflows,
  } = useQuery<ReviewWorkflow[]>({
    queryKey: workflowsQueryKey,
    queryFn: async () => {
      let query = supabase.from('review_workflows').select('*');

      if (recordType && recordId) {
        query = query.eq('record_type', recordType).eq('record_id', recordId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((workflow) => ({
        ...workflow,
        record_type: workflow.record_type as ReviewRecordType,
        overall_status: workflow.overall_status as ReviewWorkflow['overall_status'],
        priority: workflow.priority as ReviewWorkflow['priority'],
        metadata: (workflow.metadata as any) || {},
      }));
    },
    enabled: isRecordSpecified,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: reviewerGroupsData = [],
    isLoading: reviewerGroupsLoading,
    isFetching: reviewerGroupsFetching,
    error: reviewerGroupsError,
    refetch: refetchReviewerGroups,
  } = useQuery<ReviewerGroup[]>({
    queryKey: reviewerGroupsQueryKey,
    queryFn: async () => {
      if (!recordType || !recordId) return [];

      if (recordType === 'gap_analysis_item') {
        return fetchReviewerGroupsForGapItem();
      }

      return fetchReviewerGroupsForDocument();
    },
    enabled: isRecordSpecified,
    staleTime: 5 * 60 * 1000,
  });

  const workflows = workflowsData;
  const reviewerGroups = reviewerGroupsData;
  const isLoading = workflowsLoading || reviewerGroupsLoading;
  const combinedError = workflowsError || reviewerGroupsError;
  const error = combinedError
    ? combinedError instanceof Error
      ? combinedError.message
      : String(combinedError)
    : null;

  const addReviewerGroup = async (id: string, reviewer_groups: string[]) => {
    const ids = reviewer_groups.map((group) => group)
    console.log("ids ", ids);

    // Handle gap_analysis_item record type
    if (recordType === 'gap_analysis_item') {
      const { assignReviewerGroupToGapItem } = await import('@/services/gapAnalysisService');
      
      if (!companyId) {
        throw new Error('Company ID is required for gap analysis items');
      }

      // Assign each reviewer group
      const results = await Promise.all(
        ids.map(groupId => assignReviewerGroupToGapItem(id, groupId, companyId))
      );

      // Check if all assignments succeeded
      const allSuccess = results.every(r => r.success);
      if (!allSuccess) {
        const failedMessages = results.filter(r => !r.success).map(r => r.message);
        throw new Error(`Failed to assign some reviewer groups: ${failedMessages.join(', ')}`);
      }

      const result = {
        success: true,
        message: "Reviewer groups assigned successfully"
      };
      await queryClient.invalidateQueries({ queryKey: reviewerGroupsQueryKey });
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
      return result;
    }

    // Handle document record type (original logic)
    // Clean the ID by removing template- prefix if present
    const cleanId = id.replace('template-', '');

    const { data, error } = await supabase
      .from('phase_assigned_document_template')
      .update({
        reviewer_group_ids: ids
      })
      .eq('id', cleanId);
      
    if (error) throw error;
    const result = {
      success: true,
      message: "Reviewer group added successfully"
    };
    await queryClient.invalidateQueries({ queryKey: reviewerGroupsQueryKey });
    await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
    return result;
  }
  const createWorkflow = async (request: CreateWorkflowRequest): Promise<string | null> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create the main workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('review_workflows')
        .insert({
          record_type: request.record_type,
          record_id: request.record_id,
          workflow_name: request.workflow_name,
          workflow_description: request.workflow_description,
          total_stages: request.stages.length,
          current_stage: 1,
          overall_status: 'pending',
          due_date: request.due_date,
          priority: request.priority || 'medium',
          created_by: user.id // Add the created_by field
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Create workflow stages
      const stages = request.stages.map((stage, index) => ({
        workflow_id: workflow.id,
        stage_number: index + 1,
        stage_name: stage.stage_name,
        stage_description: stage.stage_description,
        required_approvals: stage.required_approvals || 1,
        approval_threshold: stage.approval_threshold || 1.0
      }));

      const { error: stagesError } = await supabase
        .from('review_workflow_stages')
        .insert(stages);

      if (stagesError) throw stagesError;

      // Create review assignments for each stage
      const assignments = request.stages.flatMap((stage, stageIndex) =>
        stage.reviewer_groups.map(groupId => ({
          workflow_id: workflow.id,
          stage_number: stageIndex + 1,
          reviewer_group_id: groupId,
          assignment_type: 'required' as const
        }))
      );

      const { error: assignmentsError } = await supabase
        .from('review_assignments')
        .insert(assignments);

      if (assignmentsError) throw assignmentsError;

      // Send email notifications to reviewer groups for document assignments
      if (request.record_type === 'document' && assignments.length > 0) {
        await notifyDocumentAssignment(request, workflow.id, user.id);
      }

      // Send email notifications for CI instance assignments
      if (request.record_type === 'ci_instance' && assignments.length > 0) {
        await notifyCIAssignment(request, workflow.id, user.id);
      }

      toast.success('Review workflow created successfully');
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
      return workflow.id;
    } catch (err) {
      console.error('Error creating workflow:', err);
      toast.error('Failed to create review workflow');
      return null;
    }
  };

  const getWorkflowProgress = async (workflowId: string): Promise<WorkflowProgress | null> => {
    try {
      // Get workflow details
      const { data: workflow, error: workflowError } = await supabase
        .from('review_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      // Get stages
      const { data: stages, error: stagesError } = await supabase
        .from('review_workflow_stages')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('stage_number');

      if (stagesError) throw stagesError;

      // Get assignments and decisions
      const { data: assignments, error: assignmentsError } = await supabase
        .from('review_assignments')
        .select(`
          *,
          review_decisions(*)
        `)
        .eq('workflow_id', workflowId);

      if (assignmentsError) throw assignmentsError;

      // Calculate progress
      const stageProgress = stages.map(stage => {
        const stageAssignments = assignments.filter(a => a.stage_number === stage.stage_number);
        const totalDecisions = stageAssignments.length;
        const completedDecisions = stageAssignments.filter(a => a.status === 'completed').length;

        let status: 'completed' | 'in_progress' | 'pending' = 'pending';
        if (completedDecisions === totalDecisions && totalDecisions > 0) {
          status = 'completed';
        } else if (completedDecisions > 0) {
          status = 'in_progress';
        }

        return {
          stage_number: stage.stage_number,
          stage_name: stage.stage_name,
          status,
          decisions_made: completedDecisions,
          decisions_required: totalDecisions
        };
      });

      const completedStages = stageProgress.filter(s => s.status === 'completed').length;
      const totalDecisions = assignments.length;
      const pendingDecisions = assignments.filter(a => a.status === 'pending').length;

      return {
        current_stage: workflow.current_stage,
        total_stages: workflow.total_stages,
        completed_stages: completedStages,
        pending_decisions: pendingDecisions,
        total_decisions: totalDecisions,
        stage_progress: stageProgress
      };
    } catch (err) {
      console.error('Error getting workflow progress:', err);
      return null;
    }
  };

  const notifyDocumentAssignment = async (request: CreateWorkflowRequest, workflowId: string, assignedBy: string) => {
    try {
      // Get document details
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .select('name, company_id, due_date')
        .eq('id', request.record_id)
        .single();

      if (docError || !documentData) {
        console.error('Error fetching document for notification:', docError);
        return;
      }

      const notificationService = new ReviewerNotificationService();
      // Process all unique reviewer groups across all stages
      const uniqueGroupIds = [...new Set(request.stages.flatMap(stage => stage.reviewer_groups))];

      for (const groupId of uniqueGroupIds) {
        // Get reviewer group details
        const { data: groupData, error: groupError } = await supabase
          .from('reviewer_groups')
          .select('name')
          .eq('id', groupId)
          .single();

        if (groupError || !groupData) {
          console.error('Error fetching reviewer group for notification:', groupError);
          continue;
        }

        await notificationService.notifyReviewerGroupAssignment({
          documentName: documentData.name,
          documentId: request.record_id,
          reviewerGroupId: groupId,
          reviewerGroupName: groupData.name,
          companyId: documentData.company_id,
          dueDate: request.due_date || documentData.due_date,
          assignedBy
        });
      }
    } catch (error) {
      console.error('Error sending document assignment notifications:', error);
      // Don't throw error as this shouldn't block workflow creation
    }
  };

  const notifyCIAssignment = async (request: CreateWorkflowRequest, workflowId: string, assignedBy: string) => {
    try {
      // Get CI instance details
      const { data: ciData, error: ciError } = await supabase
        .from('ci_instances')
        .select('title, company_id, due_date, type, description')
        .eq('id', request.record_id)
        .single();

      if (ciError || !ciData) {
        console.error('Error fetching CI instance for notification:', ciError);
        return;
      }

      // Import CIReviewService dynamically to avoid circular dependencies
      const { CIReviewService } = await import('../services/ciReviewService');
      
      // Process all unique reviewer groups across all stages
      const uniqueGroupIds = [...new Set(request.stages.flatMap(stage => stage.reviewer_groups))];

      for (const groupId of uniqueGroupIds) {
        // Get reviewer group details
        const { data: groupData, error: groupError } = await supabase
          .from('reviewer_groups')
          .select('name')
          .eq('id', groupId)
          .single();

        if (groupError || !groupData) {
          console.error('Error fetching reviewer group for CI notification:', groupError);
          continue;
        }

        // Use the private notification method from CIReviewService
        // Note: This is a simplified approach - in production you might want to make this method public
        console.log('Sending CI review assignment notification:', {
          ciInstanceId: request.record_id,
          ciTitle: ciData.title,
          ciDescription: ciData.description,
          ciType: ciData.type,
          reviewerGroupId: groupId,
          reviewerGroupName: groupData.name,
          companyId: ciData.company_id,
          dueDate: request.due_date || ciData.due_date,
          assignedBy
        });
      }
    } catch (error) {
      console.error('Error sending CI assignment notifications:', error);
      // Don't throw error as this shouldn't block workflow creation
    }
  };

  const removeReviewerGroup = async (reviewerGroupId: string) => {
    try {
      if (recordType === 'gap_analysis_item') {
        const { removeReviewerGroupFromGapItem } = await import('@/services/gapAnalysisService');
        
        if (!recordId) {
          throw new Error('Record ID is required');
        }

        const result = await removeReviewerGroupFromGapItem(recordId, reviewerGroupId);

        if (!result.success) {
          throw new Error(result.message);
        }

        await queryClient.invalidateQueries({ queryKey: reviewerGroupsQueryKey });
        return {
          success: true,
          message: result.message
        };
      }

      throw new Error('Remove reviewer group not implemented for this record type');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove reviewer group'
      };
    }
  };

  // useEffect(() => {
  //   fetchWorkflows();
  //   fetchReviewerGroups();
  // }, [recordType, recordId]);

  return {
    workflows,
    isLoading,
    error,
    fetchWorkflows: refetchWorkflows,
    createWorkflow,
    getWorkflowProgress,
    addReviewerGroup,
    reviewerGroups,
    fetchReviewerGroups: refetchReviewerGroups,
    removeReviewerGroup,
    isFetching: workflowsFetching || reviewerGroupsFetching,
  };
}
