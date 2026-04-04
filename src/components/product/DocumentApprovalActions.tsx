
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { RequestReviewDialog } from "@/components/permissions/RequestReviewDialog";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { useDocumentReviewAssignments } from "@/hooks/useDocumentReviewAssignments";

interface DocumentApprovalActionsProps {
  documentId: string;
  documentName?: string;
  companyId: string;
  isApprover?: boolean;
  canRequestReview?: boolean;
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
  onRequestReview?: (reviewerIds: string[], note: string) => void;
}

export function DocumentApprovalActions({
  documentId,
  documentName = "Document",
  companyId,
  isApprover = false,
  canRequestReview = false,
  onApprove,
  onReject,
  onRequestReview
}: DocumentApprovalActionsProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  const { reviewerGroups } = useReviewerGroups(companyId);
  const { createAssignment } = useDocumentReviewAssignments(documentId);
  
  // Convert reviewer groups to users format for the dialog
  const availableReviewers = reviewerGroups.flatMap(group => 
    (group.members || []).map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || 'Reviewer',
      external: group.group_type === 'external'
    }))
  );

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!comment.trim()) {
      toast.error("Please provide a comment before submitting your decision");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === 'approve' && onApprove) {
        await onApprove(comment);
        toast.success("Document approved successfully");
      } else if (action === 'reject' && onReject) {
        await onReject(comment);
        toast.error("Document rejected");
      }
      setComment("");
    } catch (error) {
      toast.error("Failed to submit approval decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReview = async (reviewerIds: string[], note: string) => {
    // Find the reviewer groups that contain the selected reviewers
    const groupsToAssign = reviewerGroups.filter(group => 
      group.members?.some(member => reviewerIds.includes(member.id))
    );
    
    // Create assignments for each group
    for (const group of groupsToAssign) {
      await createAssignment(companyId, documentId, group.id, undefined, note);
    }
    
    // Also call the optional callback if provided
    if (onRequestReview) {
      onRequestReview(reviewerIds, note);
    }
  };

  return (
    <div className="space-y-4 p-4 border-t bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-lg flex items-center">
          <span className="mr-2 bg-primary/10 p-1 rounded-full">🔒</span>
          Document Approval Actions
        </h4>
        <Badge className="bg-amber-500">Approval Required</Badge>
      </div>
      
      {canRequestReview && (
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setReviewDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Request Review
          </Button>
          
          <RequestReviewDialog
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            documentId={documentId}
            documentName={documentName}
            availableReviewers={availableReviewers}
            onReviewRequested={handleRequestReview}
          />
        </div>
      )}
      
      {isApprover && (
        <>
          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800 mb-4 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                Important: Product Phase Transition Blocked
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This document requires approval before the product can move to the next phase in the lifecycle. 
                Your decision will be recorded and will affect the product's workflow.
              </p>
            </div>
          </div>
          
          <Textarea
            placeholder="Add your feedback or comments for this document approval..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="destructive"
              onClick={() => handleAction('reject')}
              disabled={isSubmitting}
              className="px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Reject Document
            </Button>
            <Button
              variant="default"
              onClick={() => handleAction('approve')}
              disabled={isSubmitting}
              className="px-4"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve Document
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
