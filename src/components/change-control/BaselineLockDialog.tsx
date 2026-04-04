import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, FileText } from 'lucide-react';
import { CCRCreateDialog } from './CCRCreateDialog';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface BaselineLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewTitle: string | null;
  baselineDate: string | null;
  objectId: string;
  objectType: string;
  objectLabel: string; // e.g. "SYSR-C-01"
  companyId: string;
  productId: string;
}

export function BaselineLockDialog({
  open,
  onOpenChange,
  reviewTitle,
  baselineDate,
  objectId,
  objectType,
  objectLabel,
  companyId,
  productId,
}: BaselineLockDialogProps) {
  const [showCCRDialog, setShowCCRDialog] = useState(false);
  const { lang } = useTranslation();

  const handleCreateCCR = () => {
    onOpenChange(false);
    setShowCCRDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              {lang('changeControl.objectIsBaselined')}
            </DialogTitle>
            <DialogDescription>
              {lang('changeControl.cannotEditBaselined')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{objectLabel}</span>
              </div>
              {reviewTitle && (
                <p className="text-sm text-muted-foreground">
                  {lang('changeControl.baselinedIn')} <span className="font-medium">{reviewTitle}</span>
                  {baselineDate && (
                    <> {lang('changeControl.on')} {format(new Date(baselineDate), 'MMM d, yyyy')}</>
                  )}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {lang('changeControl.mustSubmitCCR')}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {lang('changeControl.cancel')}
            </Button>
            <Button onClick={handleCreateCCR}>
              {lang('changeControl.createCCR')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CCRCreateDialog
        open={showCCRDialog}
        onOpenChange={setShowCCRDialog}
        companyId={companyId}
        productId={productId}
        prefill={{
          targetObjectId: objectId,
          targetObjectType: objectType,
          title: `${lang('changeControl.changeRequestFor')} ${objectLabel}`,
          sourceType: 'design_review',
          changeType: objectType.includes('requirement') ? 'design' : objectType === 'hazard' ? 'design' : 'design',
        }}
      />
    </>
  );
}
