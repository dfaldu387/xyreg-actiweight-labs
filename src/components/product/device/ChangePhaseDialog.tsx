import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChangePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhase: string;
  nextPhase: string;
  canAdvance: boolean;
  onConfirm: () => void;
}

export function ChangePhaseDialog({
  open,
  onOpenChange,
  currentPhase,
  nextPhase,
  canAdvance,
  onConfirm
}: ChangePhaseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {canAdvance ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            Advance to Next Phase?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              You are about to advance from <span className="font-semibold text-foreground">{currentPhase}</span> to <span className="font-semibold text-foreground">{nextPhase}</span>.
            </div>
            
            {!canAdvance && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Warning</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  The current phase has incomplete documents or overdue items. It's recommended to complete all activities before advancing.
                </p>
              </div>
            )}

            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Mark {currentPhase} as completed</li>
                <li>Set {nextPhase} as the current active phase</li>
                <li>Update project timeline and metrics</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Advance Phase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
