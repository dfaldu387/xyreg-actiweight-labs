
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ReviewDecisionRecord, ReviewDecision, ReviewAssignment } from '@/types/review';

export function useReviewDecisions(workflowId?: string) {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [decisions, setDecisions] = useState<ReviewDecisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignmentsAndDecisions = async () => {
    if (!workflowId) return;

    try {
      setIsLoading(true);
      
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('review_assignments')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('stage_number');

      if (assignmentsError) throw assignmentsError;

      // Fetch decisions
      const { data: decisionsData, error: decisionsError } = await supabase
        .from('review_decisions')
        .select(`
          *,
          review_assignments!inner(workflow_id)
        `)
        .eq('review_assignments.workflow_id', workflowId);

      if (decisionsError) throw decisionsError;

      // Cast the data to proper types
      const typedAssignments = (assignmentsData || []).map(assignment => ({
        ...assignment,
        assignment_type: assignment.assignment_type as ReviewAssignment['assignment_type'],
        status: assignment.status as ReviewAssignment['status']
      }));

      const typedDecisions = (decisionsData || []).map(decision => ({
        ...decision,
        decision: decision.decision as ReviewDecision,
        metadata: (decision.metadata as any) || {}
      }));

      setAssignments(typedAssignments);
      setDecisions(typedDecisions);
    } catch (err) {
      console.error('Error fetching assignments and decisions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch review data');
    } finally {
      setIsLoading(false);
    }
  };

  const submitDecision = async (
    assignmentId: string,
    decision: ReviewDecision,
    comments?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the assignment to find workflow_id
      const { data: assignment, error: assignmentFetchError } = await supabase
        .from('review_assignments')
        .select('workflow_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentFetchError || !assignment) {
        throw new Error('Failed to fetch assignment details');
      }

      const { error } = await supabase
        .from('review_decisions')
        .upsert({
          assignment_id: assignmentId,
          reviewer_id: user.id,
          decision,
          comments,
          is_final: true
        });

      if (error) throw error;

      // Update assignment status
      const { error: assignmentError } = await supabase
        .from('review_assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (assignmentError) throw assignmentError;

      toast.success(`Review ${decision} submitted successfully`);
      
      // Check if workflow should advance
      const { ReviewWorkflowAdvancementService } = await import('@/services/reviewWorkflowAdvancementService');
      await ReviewWorkflowAdvancementService.checkAndAdvanceWorkflow(assignment.workflow_id);
      
      fetchAssignmentsAndDecisions();
      return true;
    } catch (err) {
      console.error('Error submitting decision:', err);
      toast.error('Failed to submit review decision');
      return false;
    }
  };

  const getUserAssignments = async (userId: string): Promise<ReviewAssignment[]> => {
    try {
      // Get user's reviewer group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('reviewer_group_members')
        .select('group_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (membershipsError) throw membershipsError;

      const groupIds = memberships.map(m => m.group_id);
      if (groupIds.length === 0) return [];

      // Get assignments for user's groups
      const { data: userAssignments, error: assignmentsError } = await supabase
        .from('review_assignments')
        .select(`
          *,
          review_workflows(*)
        `)
        .in('reviewer_group_id', groupIds)
        .eq('status', 'pending');

      if (assignmentsError) throw assignmentsError;

      // Cast the data to proper types
      return (userAssignments || []).map(assignment => ({
        ...assignment,
        assignment_type: assignment.assignment_type as ReviewAssignment['assignment_type'],
        status: assignment.status as ReviewAssignment['status']
      }));
    } catch (err) {
      console.error('Error fetching user assignments:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchAssignmentsAndDecisions();
  }, [workflowId]);

  return {
    assignments,
    decisions,
    isLoading,
    error,
    submitDecision,
    getUserAssignments,
    refetch: fetchAssignmentsAndDecisions
  };
}
