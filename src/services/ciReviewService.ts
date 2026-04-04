import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CIInstance } from './ciInstanceService';

export interface CIReviewNotification {
  ciInstanceId: string;
  ciTitle: string;
  ciDescription?: string;
  ciType: string;
  reviewerGroupId: string;
  reviewerGroupName: string;
  companyId: string;
  productId?: string;
  phaseId?: string;
  dueDate?: string;
  assignedBy: string;
}

export class CIReviewService {
  /**
   * Create a review workflow for a CI instance when reviewer group is assigned
   */
  static async createCIReviewWorkflow(
    ciInstanceId: string,
    reviewerGroupId: string,
    assignedBy: string,
    dueDate?: string
  ): Promise<string | null> {
    try {
      console.log('[CIReviewService] Creating CI review workflow:', { ciInstanceId, reviewerGroupId });

      // Get CI instance details
      const { data: ciInstance, error: ciError } = await supabase
        .from('ci_instances')
        .select('*')
        .eq('id', ciInstanceId)
        .single();

      if (ciError || !ciInstance) {
        console.error('[CIReviewService] Error fetching CI instance:', ciError);
        toast.error('Failed to fetch CI instance details');
        return null;
      }

      // Get reviewer group details
      const { data: reviewerGroup, error: groupError } = await supabase
        .from('reviewer_groups')
        .select('name')
        .eq('id', reviewerGroupId)
        .single();

      if (groupError || !reviewerGroup) {
        console.error('[CIReviewService] Error fetching reviewer group:', groupError);
        toast.error('Failed to fetch reviewer group details');
        return null;
      }

      // Create review workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('review_workflows')
        .insert({
          record_type: 'ci_instance' as const,
          record_id: ciInstanceId,
          workflow_name: `CI Review: ${ciInstance.title}`,
          workflow_description: `Review for CI instance "${ciInstance.title}" of type "${ciInstance.type}"`,
          total_stages: 1,
          current_stage: 1,
          overall_status: 'pending',
          due_date: dueDate,
          priority: ciInstance.priority === 'critical' ? 'high' : 
                   ciInstance.priority === 'high' ? 'medium' : 'low',
          created_by: assignedBy,
          metadata: {
            ci_type: ciInstance.type,
            ci_priority: ciInstance.priority,
            phase_id: ciInstance.phase_id,
            product_id: ciInstance.product_id
          }
        })
        .select()
        .single();

      if (workflowError) {
        console.error('[CIReviewService] Error creating workflow:', workflowError);
        toast.error('Failed to create review workflow');
        return null;
      }

      // Create workflow stage
      const { error: stageError } = await supabase
        .from('review_workflow_stages')
        .insert({
          workflow_id: workflow.id,
          stage_number: 1,
          stage_name: 'CI Review',
          stage_description: `Review and approve CI instance: ${ciInstance.title}`,
          required_approvals: 1,
          approval_threshold: 1.0
        });

      if (stageError) {
        console.error('[CIReviewService] Error creating workflow stage:', stageError);
        toast.error('Failed to create workflow stage');
        return null;
      }

      // Create review assignment
      const { error: assignmentError } = await supabase
        .from('review_assignments')
        .insert({
          workflow_id: workflow.id,
          stage_number: 1,
          reviewer_group_id: reviewerGroupId,
          assignment_type: 'required',
          assigned_by: assignedBy,
          due_date: dueDate
        });

      if (assignmentError) {
        console.error('[CIReviewService] Error creating review assignment:', assignmentError);
        toast.error('Failed to create review assignment');
        return null;
      }

      // Update CI instance status to indicate it's under review
      await supabase
        .from('ci_instances')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ciInstanceId);

      // Send notifications
      await this.notifyCIReviewAssignment({
        ciInstanceId,
        ciTitle: ciInstance.title,
        ciDescription: ciInstance.description,
        ciType: ciInstance.type,
        reviewerGroupId,
        reviewerGroupName: reviewerGroup.name,
        companyId: ciInstance.company_id,
        productId: ciInstance.product_id,
        phaseId: ciInstance.phase_id,
        dueDate,
        assignedBy
      });

      console.log('[CIReviewService] CI review workflow created successfully');
      toast.success('CI review workflow created successfully');
      return workflow.id;

    } catch (error) {
      console.error('[CIReviewService] Error creating CI review workflow:', error);
      toast.error('Failed to create CI review workflow');
      return null;
    }
  }

  /**
   * Process CI review decision
   */
  static async processCIReviewDecision(
    assignmentId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected' | 'needs_changes',
    comments?: string
  ): Promise<boolean> {
    try {
      console.log('[CIReviewService] Processing CI review decision:', { assignmentId, decision });

      // Create decision record
      const { data: decisionRecord, error: decisionError } = await supabase
        .from('review_decisions')
        .insert({
          assignment_id: assignmentId,
          reviewer_id: reviewerId,
          decision,
          comments,
          is_final: true
        })
        .select()
        .single();

      if (decisionError) {
        console.error('[CIReviewService] Error creating decision record:', decisionError);
        toast.error('Failed to record review decision');
        return false;
      }

      // Update assignment status
      const { error: assignmentUpdateError } = await supabase
        .from('review_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (assignmentUpdateError) {
        console.error('[CIReviewService] Error updating assignment:', assignmentUpdateError);
        toast.error('Failed to update assignment status');
        return false;
      }

      // Get workflow details
      const { data: assignment, error: assignmentError } = await supabase
        .from('review_assignments')
        .select('workflow_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError || !assignment) {
        console.error('[CIReviewService] Error fetching assignment details:', assignmentError);
        return false;
      }

      // Use the workflow advancement service to check if workflow should advance
      const { ReviewWorkflowAdvancementService } = await import('@/services/reviewWorkflowAdvancementService');
      await ReviewWorkflowAdvancementService.checkAndAdvanceWorkflow(assignment.workflow_id);

      console.log('[CIReviewService] CI review decision processed successfully');
      toast.success(`CI review ${decision} successfully`);
      return true;

    } catch (error) {
      console.error('[CIReviewService] Error processing CI review decision:', error);
      toast.error('Failed to process review decision');
      return false;
    }
  }

  /**
   * Send notifications for CI review assignment
   */
  private static async notifyCIReviewAssignment(notification: CIReviewNotification): Promise<boolean> {
    try {
      console.log('[CIReviewService] Sending CI review assignment notifications');

      // Get reviewer group members
      const { data: reviewerGroupData, error: groupError } = await supabase
        .from('reviewer_groups')
        .select(`
          *,
          reviewer_group_members_new!reviewer_group_members_new_group_id_fkey(
            *,
            user_profiles(
              first_name,
              last_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('id', notification.reviewerGroupId)
        .single();

      if (groupError || !reviewerGroupData) {
        console.error('[CIReviewService] Error fetching reviewer group:', groupError);
        return false;
      }

      // Get company name
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', notification.companyId)
        .single();

      // Get sender details
      const { data: senderData } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', notification.assignedBy)
        .single();

      const senderName = senderData 
        ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || 'System'
        : 'System';

      const companyName = companyData?.name || 'Unknown Company';
      const members = reviewerGroupData.reviewer_group_members_new || [];

      // Check if notifications are enabled for this group
      const groupSettings = reviewerGroupData.settings as any;
      if (!groupSettings?.enableNotifications) {
        console.log('[CIReviewService] Notifications disabled for group:', notification.reviewerGroupName);
        return true;
      }

      // Send emails to all active members
      const emailPromises = members
        .filter((member: any) => {
          const isActive = member.is_active;
          const hasEmailEnabled = member.notification_preferences?.email !== false;
          const hasEmail = member.user_profiles?.email;
          
          return isActive && hasEmailEnabled && hasEmail;
        })
        .map(async (member: any) => {
          const memberName = member.user_profiles 
            ? `${member.user_profiles.first_name || ''} ${member.user_profiles.last_name || ''}`.trim()
            : 'Reviewer';

          const emailData = {
            reviewerEmail: member.user_profiles.email,
            reviewerName: memberName || 'Reviewer',
            documentName: notification.ciTitle, // Use CI title as document name for email template
            reviewerGroupName: notification.reviewerGroupName,
            companyName,
            dueDate: notification.dueDate,
            senderName,
            ciType: notification.ciType,
            ciDescription: notification.ciDescription,
            recordType: 'ci_instance'
          };

          try {
            console.log('[CIReviewService] Sending CI review email to:', emailData.reviewerEmail);

            const { data, error } = await supabase.functions.invoke('send-reviewer-assignment-email', {
              body: emailData
            });

            if (error) {
              console.error('[CIReviewService] Error sending email to:', emailData.reviewerEmail, error);
              return false;
            }

            console.log('[CIReviewService] CI review email sent successfully to:', emailData.reviewerEmail);
            return true;
          } catch (error) {
            console.error('[CIReviewService] Exception sending email to:', emailData.reviewerEmail, error);
            return false;
          }
        });

      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      const successCount = results.filter(Boolean).length;
      const totalCount = results.length;

      console.log(`[CIReviewService] CI review email notifications sent: ${successCount}/${totalCount}`);

      return successCount > 0 || totalCount === 0;
    } catch (error) {
      console.error('[CIReviewService] Error sending CI review notifications:', error);
      return false;
    }
  }

  /**
   * Get CI instances pending review for a reviewer
   */
  static async getPendingCIReviews(userId: string, companyId: string): Promise<any[]> {
    try {
      // Get user's reviewer group memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('reviewer_group_members_new')
        .select('group_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (membershipError || !memberships?.length) {
        console.log('[CIReviewService] No active reviewer group memberships found');
        return [];
      }

      const groupIds = memberships.map(m => m.group_id);

      // Get pending CI review assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('review_assignments')
        .select(`
          *,
          review_workflows!inner(
            *,
            ci_instances:record_id(*)
          )
        `)
        .in('reviewer_group_id', groupIds)
        .eq('status', 'pending')
        .eq('review_workflows.record_type', 'ci_instance')
        .eq('review_workflows.overall_status', 'pending');

      if (assignmentsError) {
        console.error('[CIReviewService] Error fetching pending CI reviews:', assignmentsError);
        return [];
      }

      return assignments || [];
    } catch (error) {
      console.error('[CIReviewService] Error getting pending CI reviews:', error);
      return [];
    }
  }
}