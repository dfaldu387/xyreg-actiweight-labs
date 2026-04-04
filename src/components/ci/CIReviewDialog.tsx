import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CIReviewPanel } from './CIReviewPanel';
import { CIReviewService } from '@/services/ciReviewService';
import { supabase } from '@/integrations/supabase/client';

interface CIReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ciInstance: {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    priority: string;
    assigned_to?: string;
    due_date?: string;
    created_at: string;
    instance_config: any;
  };
  assignmentId?: string;
  onApprove?: (ciId: string, comments?: string) => void;
  onReject?: (ciId: string, comments: string) => void;
  onRequestChanges?: (ciId: string, comments: string) => void;
}

export function CIReviewDialog({ 
  open, 
  onOpenChange, 
  ciInstance,
  assignmentId,
  onApprove, 
  onReject, 
  onRequestChanges 
}: CIReviewDialogProps) {
  const handleApprove = async (ciId: string, comments?: string) => {
    if (onApprove) {
      await onApprove(ciId, comments);
    } else if (assignmentId) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await CIReviewService.processCIReviewDecision(
          assignmentId,
          user.id,
          'approved',
          comments
        );
        onOpenChange(false);
      }
    }
  };

  const handleReject = async (ciId: string, comments: string) => {
    if (onReject) {
      await onReject(ciId, comments);
    } else if (assignmentId) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await CIReviewService.processCIReviewDecision(
          assignmentId,
          user.id,
          'rejected',
          comments
        );
        onOpenChange(false);
      }
    }
  };

  const handleRequestChanges = async (ciId: string, comments: string) => {
    if (onRequestChanges) {
      await onRequestChanges(ciId, comments);
    } else if (assignmentId) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await CIReviewService.processCIReviewDecision(
          assignmentId,
          user.id,
          'needs_changes',
          comments
        );
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Compliance Instance</DialogTitle>
        </DialogHeader>
        <CIReviewPanel
          ciInstance={ciInstance}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={handleRequestChanges}
        />
      </DialogContent>
    </Dialog>
  );
}