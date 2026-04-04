import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CAPARecord, CAPAStatus, CAPA_STATE_GATES, CAPA_STATUS_LABELS, CAPA_GATE_RULES } from '@/types/capa';
import { useTransitionCAPAState } from '@/hooks/useCAPAData';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPATransitionPanelProps {
  capa: CAPARecord;
}

export function CAPATransitionPanel({ capa }: CAPATransitionPanelProps) {
  const { user } = useAuth();
  const transitionMutation = useTransitionCAPAState();
  const { lang } = useTranslation();

  const [selectedTransition, setSelectedTransition] = useState<CAPAStatus | null>(null);
  const [reason, setReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableTransitions = CAPA_STATE_GATES[capa.status] || [];

  const validateTransition = (toStatus: CAPAStatus): string | null => {
    const rule = CAPA_GATE_RULES.find(r => {
      const fromMatch = Array.isArray(r.from)
        ? r.from.includes(capa.status)
        : r.from === capa.status;
      return fromMatch && r.to === toStatus;
    });

    if (!rule) return null;

    // Check required fields
    if (rule.required_fields) {
      for (const field of rule.required_fields) {
        const value = capa[field];
        if (value === null || value === undefined || value === '') {
          return rule.validation_message;
        }
      }
    }

    // Check required approvals
    if (rule.required_approvals) {
      if (rule.required_approvals.includes('technical') && !capa.technical_approved) {
        return 'Technical lead approval is required';
      }
      if (rule.required_approvals.includes('quality') && !capa.quality_approved) {
        return 'Quality lead approval is required';
      }
    }

    return null;
  };

  const handleTransitionClick = (toStatus: CAPAStatus) => {
    const error = validateTransition(toStatus);
    setValidationError(error);
    setSelectedTransition(toStatus);
    setReason('');
    setDialogOpen(true);
  };

  const handleConfirmTransition = async () => {
    if (!selectedTransition || !user?.id) return;

    await transitionMutation.mutateAsync({
      capaId: capa.id,
      fromStatus: capa.status,
      toStatus: selectedTransition,
      userId: user.id,
      reason: reason || undefined,
    });

    setDialogOpen(false);
    setSelectedTransition(null);
    setReason('');
    setValidationError(null);
  };

  if (capa.status === 'closed' || capa.status === 'rejected') {
    return (
      <div className="text-center text-muted-foreground py-2">
        {lang('capa.capaIsClosed', { status: capa.status })}
      </div>
    );
  }

  if (availableTransitions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-2">
        {lang('capa.noAvailableTransitions')}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center">
        {availableTransitions.map((targetStatus) => {
          const isReject = targetStatus === 'rejected';
          const isRegression =
            ['triage', 'investigation', 'planning', 'implementation'].includes(targetStatus) &&
            capa.status !== 'draft';

          return (
            <Button
              key={targetStatus}
              variant={isReject ? 'destructive' : isRegression ? 'outline' : 'default'}
              size="sm"
              onClick={() => handleTransitionClick(targetStatus)}
              disabled={transitionMutation.isPending}
            >
              {isReject ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {isRegression ? lang('capa.returnTo') + ' ' : lang('capa.moveTo') + ' '}
              {CAPA_STATUS_LABELS[targetStatus]}
            </Button>
          );
        })}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTransition === 'rejected' ? lang('capa.rejectCapa') : lang('capa.confirmTransition')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTransition === 'rejected'
                ? lang('capa.rejectWarning')
                : lang('capa.moveDescription', { from: CAPA_STATUS_LABELS[capa.status], to: selectedTransition ? CAPA_STATUS_LABELS[selectedTransition] : '' })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          {validationError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>{lang('capa.warning')}:</strong> {validationError}
                <br />
                <span className="text-xs">{lang('capa.proceedWarning')}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{lang('capa.reasonForTransition')}</Label>
            <Textarea
              id="reason"
              placeholder={lang('capa.provideContext')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{lang('capa.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransition}
              disabled={transitionMutation.isPending}
              className={selectedTransition === 'rejected' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {transitionMutation.isPending ? lang('capa.processing') : lang('capa.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
