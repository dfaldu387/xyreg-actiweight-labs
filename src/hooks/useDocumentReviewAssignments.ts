import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentReviewAssignment {
  id: string;
  company_id: string;
  document_id: string;
  reviewer_group_id: string | null;
  reviewer_user_id?: string | null;
  assigned_by?: string;
  assigned_at: string;
  due_date?: string;
  status: 'pending' | 'in_review' | 'completed' | 'skipped' | 'rejected';
  notes?: string;
  completed_at?: string;
}

export function useDocumentReviewAssignments(documentId?: string) {
  const [assignments, setAssignments] = useState<DocumentReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Strip "template-" prefix if present since the DB column is UUID type
  const cleanDocumentId = documentId?.startsWith('template-')
    ? documentId.replace('template-', '')
    : documentId;

  const fetchAssignments = async () => {
    if (!cleanDocumentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('document_review_assignments')
        .select('*')
        .eq('document_id', cleanDocumentId)
        .order('assigned_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAssignments((data || []) as DocumentReviewAssignment[]);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching document review assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [cleanDocumentId]);

  const createAssignment = async (
    companyId: string,
    documentId: string,
    reviewerGroupId: string,
    dueDate?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('document_review_assignments')
        .insert({
          company_id: companyId,
          document_id: documentId,
          reviewer_group_id: reviewerGroupId,
          due_date: dueDate,
          notes: notes,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success('Review assignment created successfully');
      await fetchAssignments();
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating review assignment:', error);
      toast.error('Failed to create review assignment');
      return false;
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: 'pending' | 'in_review' | 'completed' | 'skipped' | 'rejected',
    reviewerGroupId: string
  ): Promise<boolean> => {
    try {
      console.log("updateAssignmentStatus", assignmentId, status, reviewerGroupId);

      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      let query = supabase
        .from('document_review_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      // For group-based assignments, also filter by group ID
      // For individual assignments (no group), skip the group filter
      if (reviewerGroupId) {
        query = query.eq('reviewer_group_id', reviewerGroupId);
      }

      const { error: updateError } = await query;

      if (updateError) throw updateError;

      toast.success('Assignment status updated');
      await fetchAssignments();
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update assignment status');
      return false;
    }
  };

  const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('document_review_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      toast.success('Review assignment deleted');
      await fetchAssignments();
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting review assignment:', error);
      toast.error('Failed to delete review assignment');
      return false;
    }
  };

  return {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignmentStatus,
    deleteAssignment,
    refetch: fetchAssignments
  };
}
