import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmdnNavigationTree } from './EmdnNavigationTree';
import { useTranslation } from '@/hooks/useTranslation';

interface EmdnNavigationPopupProps {
  currentEmdnCode: string;
  startingEmdnCode: string;
  onEmdnCodeChange?: (newCode: string) => void;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmdnNavigationPopup({
  currentEmdnCode,
  startingEmdnCode,
  onEmdnCodeChange,
  trigger,
  open,
  onOpenChange
}: EmdnNavigationPopupProps) {
  const { lang } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('emdnNavigation.title')}</DialogTitle>
          <DialogDescription>
            {lang('emdnNavigation.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <EmdnNavigationTree
            currentEmdnCode={currentEmdnCode}
            startingEmdnCode={startingEmdnCode}
            onEmdnCodeChange={onEmdnCodeChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}