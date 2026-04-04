
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentItem } from '@/types/client';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DocumentDeleteDialogProps {
  document: DocumentItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentDeleted: () => void;
  companyId: string;
}

export function DocumentDeleteDialog({
  document,
  open,
  onOpenChange,
  onDocumentDeleted,
  companyId
}: DocumentDeleteDialogProps) {
  const navigate = useNavigate();
  const handleDelete = async () => {
    try {
      console.log("Deleting document from all phases:", document.name);

      // First, get all phase assignments for this document in this company
      const { data: assignments, error: fetchError } = await supabase
        .from('phase_assigned_document_template')
        .select('id, phase_id, name')
        .eq('name', document.name)
        .eq('company_id', companyId);

      if (fetchError) {
        console.error('Error fetching document assignments:', fetchError);
        toast.error(`Failed to fetch document assignments: ${fetchError.message}`);
        return;
      }

      console.log(`Found ${assignments?.length || 0} phase assignments for document "${document.name}"`);

      if (!assignments || assignments.length === 0) {
        toast.info('Document not found in any phases');
        onDocumentDeleted();
        onOpenChange(false);
        return;
      }

      // Delete all phase assignments for this document
      const { data: deletedData, error: deleteError } = await supabase
        .from('phase_assigned_document_template')
        .delete()
        .eq('name', document.name)
        .eq('company_id', companyId)
        .select('id');

      console.log("Delete result:", { deletedData, deleteError });

      if (deleteError) {
        console.error('Error deleting document:', deleteError);
        toast.error(`Failed to delete document: ${deleteError.message}`);
        return;
      }

      const deletedCount = deletedData?.length || 0;
      toast.success(`Document "${document.name}" deleted successfully from ${deletedCount} phase${deletedCount !== 1 ? 's' : ''}`);
      onDocumentDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p>Are you sure you want to delete "{document.name}"?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
