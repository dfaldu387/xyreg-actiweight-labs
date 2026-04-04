
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ActivityForm } from './ActivityForm';
import { Activity } from '@/types/activities';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSave: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<Activity>;
}

export function ActivityDialog({ open, onOpenChange, companyId, onSave }: ActivityDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ActivityForm
          companyId={companyId}
          onSave={onSave}
          onCancel={handleClose}
          onBack={handleClose}
          title="Schedule Activity"
        />
      </DialogContent>
    </Dialog>
  );
}
