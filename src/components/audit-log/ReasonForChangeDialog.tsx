import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileEdit } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReasonForChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  title?: string;
  entityName?: string;
  isLoading?: boolean;
}

export function ReasonForChangeDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  entityName,
  isLoading = false,
}: ReasonForChangeDialogProps) {
  const { lang } = useTranslation();
  const dialogTitle = title || lang('auditLog.reasonForChange.title');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleCancel(); else onOpenChange(val); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {entityName && (
            <p className="text-sm text-muted-foreground">
              {lang('auditLog.reasonForChange.savingChangesTo')} <span className="font-medium text-foreground">{entityName}</span>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {lang('auditLog.reasonForChange.whyQuestion')} <span className="text-destructive">{lang('auditLog.reasonForChange.required')}</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={lang('auditLog.reasonForChange.placeholder')}
              rows={3}
              className="resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {lang('auditLog.reasonForChange.complianceNote')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {lang('auditLog.reasonForChange.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !reason.trim()}>
            {isLoading ? lang('auditLog.reasonForChange.saving') : lang('auditLog.reasonForChange.saveWithReason')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
