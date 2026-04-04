import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useDocumentReviewAssignments } from '@/hooks/useDocumentReviewAssignments';

interface DocumentReviewActionsProps {
  documentId: string;
  reviewerGroupId: string;
  companyId: string;
  onReviewComplete?: () => void;
}

export function DocumentReviewActions({ 
  documentId, 
  reviewerGroupId,
  companyId,
  onReviewComplete 
}: DocumentReviewActionsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { assignments, updateAssignmentStatus } = useDocumentReviewAssignments(documentId);

  const handleReviewDecision = async (decision: 'approved' | 'rejected' | 'needs_changes') => {
    if (!user?.id) {
      toast.error('You must be logged in to submit a review');
      return;
    }

    if (!comments.trim()) {
      toast.error('Please provide comments for your review decision');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the assignment for this reviewer group
      const assignment = assignments.find(a => a.reviewer_group_id === reviewerGroupId);
      
      if (!assignment) {
        toast.error('No review assignment found for this reviewer group');
        return;
      }

      // Map decision to status
      const status: 'pending' | 'in_review' | 'completed' | 'skipped' | 'rejected' = 
        decision === 'approved' ? 'completed' : 
        decision === 'rejected' ? 'rejected' :
        'in_review';

      // Update the assignment status
      const success = await updateAssignmentStatus(assignment.id, status, reviewerGroupId);
      
      if (!success) {
        throw new Error('Failed to update assignment status');
      }

      // Save review note
      const cleanDocumentId = documentId.startsWith('template-') 
        ? documentId.replace('template-', '') 
        : documentId;
      
      const isTemplateDocument = documentId.startsWith('template-');
      
      const notePayload = isTemplateDocument
        ? { template_document_id: cleanDocumentId, reviewer_id: user.id, note: comments.trim() }
        : { document_id: cleanDocumentId, reviewer_id: user.id, note: comments.trim() };

      await supabase
        .from('document_review_notes')
        .insert(notePayload);

      toast.success(
        decision === 'approved' ? 'Review decision submitted' :
        decision === 'rejected' ? 'Rejection submitted' :
        'Change request submitted'
      );

      setComments('');
      onReviewComplete?.();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Decision</CardTitle>
        <CardDescription>
          Provide your feedback and decision for this document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Comments *</label>
          <Textarea
            placeholder="Enter your review comments, feedback, or reasons for your decision..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleReviewDecision('approved')}
            disabled={isSubmitting || !comments.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve Document
          </Button>

          <Button
            onClick={() => handleReviewDecision('needs_changes')}
            disabled={isSubmitting || !comments.trim()}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2" />
            )}
            Request Changes
          </Button>

          <Button
            onClick={() => handleReviewDecision('rejected')}
            disabled={isSubmitting || !comments.trim()}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Reject Document
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          * Comments are required to submit your review decision
        </p>
      </CardContent>
    </Card>
  );
}
