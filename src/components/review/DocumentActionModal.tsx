import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface DocumentActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  reviewerGroupId?: string;
  onActionComplete?: () => void;
}

type ActionType = 'approve' | 'reject' | 'request_changes' | null;

export function DocumentActionModal({
  open,
  onOpenChange,
  documentId,
  documentName,
  reviewerGroupId,
  onActionComplete,
}: DocumentActionModalProps) {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [existingNote, setExistingNote] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing note when modal opens
  const loadExistingNote = async () => {
    if (!user?.id || !documentId) return;
    
    const isTemplateDocument = documentId.startsWith('template-');
    const actualDocId = isTemplateDocument ? documentId.replace('template-', '') : documentId;
    
    const { data: notes } = await supabase
      .from('document_review_notes')
      .select('note, created_at')
      .eq('reviewer_id', user.id)
      .or(isTemplateDocument
        ? `template_document_id.eq.${actualDocId}`
        : `document_id.eq.${documentId}`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (notes && notes.length > 0) {
      setExistingNote(notes[0].note);
      setComments(notes[0].note);
    }
  };

  // Load note when modal opens
  if (open && user?.id && !existingNote && !selectedAction) {
    loadExistingNote();
  }

  const handleActionSelect = (action: ActionType) => {
    setSelectedAction(action);
    if (action !== 'request_changes' && !existingNote) {
      setComments('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAction || !user?.id) {
      toast.error('Please select an action');
      return;
    }

    if (selectedAction === 'request_changes' && !comments.trim()) {
      toast.error('Please provide details for requested changes');
      return;
    }

    setIsSubmitting(true);

    try {
      const isTemplateDocument = documentId.startsWith('template-');
      const actualDocId = isTemplateDocument ? documentId.replace('template-', '') : documentId;
      const tableName = isTemplateDocument ? 'phase_assigned_document_template' : 'documents';

      // Map action to status
      const statusMap = {
        approve: 'Approved',
        reject: 'Rejected',
        request_changes: 'Changes Requested'
      };

      const newStatus = statusMap[selectedAction];

      // Update document status
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', actualDocId);

      if (updateError) throw updateError;

      // Save review note (no assignments/decisions)
      if (comments.trim()) {
        const noteData = isTemplateDocument
          ? {
              template_document_id: actualDocId,
              reviewer_id: user.id,
              note: comments.trim(),
            }
          : {
              document_id: actualDocId,
              reviewer_id: user.id,
              note: comments.trim(),
            };

        const { error: noteError } = await supabase
          .from('document_review_notes')
          .insert(noteData);

        if (noteError) throw noteError;
      }

      const actionMessages = {
        approve: 'Document approved successfully',
        reject: 'Document rejected',
        request_changes: 'Changes requested for document'
      };

      toast.success(actionMessages[selectedAction]);
      
      // Reset state
      setSelectedAction(null);
      setComments('');
      onOpenChange(false);
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error submitting review action:', error);
      toast.error('Failed to submit review action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    setComments('');
    setExistingNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Document Action</DialogTitle>
          <DialogDescription>
            Choose an action for "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Selection */}
          {!selectedAction ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-950"
                onClick={() => handleActionSelect('approve')}
              >
                <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">Approve</div>
                  <div className="text-sm text-muted-foreground">
                    Mark this document as approved
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 hover:bg-red-50 hover:border-red-500 dark:hover:bg-red-950"
                onClick={() => handleActionSelect('reject')}
              >
                <XCircle className="h-5 w-5 mr-3 text-red-600" />
                <div className="text-left">
                  <div className="font-semibold">Reject</div>
                  <div className="text-sm text-muted-foreground">
                    Reject this document
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 hover:bg-orange-50 hover:border-orange-500 dark:hover:bg-orange-950"
                onClick={() => handleActionSelect('request_changes')}
              >
                <AlertCircle className="h-5 w-5 mr-3 text-orange-600" />
                <div className="text-left">
                  <div className="font-semibold">Request Changes</div>
                  <div className="text-sm text-muted-foreground">
                    Request modifications to this document
                  </div>
                </div>
              </Button>
            </div>
          ) : (
            <>
              {/* Selected Action Display */}
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAction === 'approve' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {selectedAction === 'reject' && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {selectedAction === 'request_changes' && (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="font-semibold">
                    {selectedAction === 'approve' && 'Approve Document'}
                    {selectedAction === 'reject' && 'Reject Document'}
                    {selectedAction === 'request_changes' && 'Request Changes'}
                  </span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {selectedAction === 'request_changes' ? (
                    <>Changes Needed <span className="text-destructive">*</span></>
                  ) : (
                    'Comments (Optional)'
                  )}
                </label>
                {existingNote && (
                  <div className="p-3 mb-2 bg-muted/50 rounded-md border text-sm">
                    <p className="font-medium mb-1">Your previous note:</p>
                    <p className="text-muted-foreground">{existingNote}</p>
                  </div>
                )}
                <Textarea
                  placeholder={
                    selectedAction === 'request_changes'
                      ? 'Describe the changes that need to be made...'
                      : 'Add any additional comments...'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {selectedAction ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAction(null);
                  setComments('');
                }}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
