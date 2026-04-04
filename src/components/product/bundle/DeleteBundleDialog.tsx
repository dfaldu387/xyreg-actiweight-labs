import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useDeleteBundleGroup } from '@/hooks/useProductBundleGroups';
import { toast } from 'sonner';

interface DeleteBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundleId: string;
  bundleName: string;
  memberCount: number;
}

export function DeleteBundleDialog({
  open,
  onOpenChange,
  bundleId,
  bundleName,
  memberCount,
}: DeleteBundleDialogProps) {
  const deleteMutation = useDeleteBundleGroup();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(bundleId);
      toast.success('Bundle deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast.error('Failed to delete bundle');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Bundle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">
              Warning: This action cannot be undone
            </p>
            <p className="text-sm text-muted-foreground">
              You are about to delete the bundle <span className="font-semibold">"{bundleName}"</span>.
            </p>
            {memberCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                This will remove all {memberCount} member{memberCount !== 1 ? 's' : ''} from the bundle.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Bundle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
