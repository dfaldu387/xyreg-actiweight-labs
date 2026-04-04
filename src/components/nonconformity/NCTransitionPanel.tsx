import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NCRecord, NCStatus, NC_STATE_GATES, NC_STATUS_LABELS, NC_GATE_RULES } from '@/types/nonconformity';
import { useTransitionNCState } from '@/hooks/useNonconformityData';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface NCTransitionPanelProps {
  nc: NCRecord;
}

export function NCTransitionPanel({ nc }: NCTransitionPanelProps) {
  const { user } = useAuth();
  const transitionMutation = useTransitionNCState();
  const [selectedTransition, setSelectedTransition] = useState<NCStatus | null>(null);
  const [reason, setReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { lang } = useTranslation();

  const available = NC_STATE_GATES[nc.status] || [];

  const validate = (toStatus: NCStatus): string | null => {
    const rule = NC_GATE_RULES.find(r => {
      const fromMatch = Array.isArray(r.from) ? r.from.includes(nc.status) : r.from === nc.status;
      return fromMatch && r.to === toStatus;
    });
    if (!rule?.required_fields) return null;
    for (const field of rule.required_fields) {
      const v = nc[field];
      if (v === null || v === undefined || v === '') return rule.validation_message;
    }
    return null;
  };

  const handleClick = (to: NCStatus) => {
    setValidationError(validate(to));
    setSelectedTransition(to);
    setReason('');
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedTransition || !user?.id) return;
    await transitionMutation.mutateAsync({
      ncId: nc.id, fromStatus: nc.status, toStatus: selectedTransition, userId: user.id, reason: reason || undefined,
    });
    setDialogOpen(false);
    setSelectedTransition(null);
    setReason('');
  };

  if (nc.status === 'closed') {
    return <div className="text-center text-muted-foreground py-2">{lang('nonconformity.ncClosed')}</div>;
  }
  if (available.length === 0) {
    return <div className="text-center text-muted-foreground py-2">{lang('nonconformity.noTransitions')}</div>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center">
        {available.map((target) => {
          const isRegression = ['open', 'investigation'].includes(target) && nc.status !== 'open';
          return (
            <Button key={target} variant={isRegression ? 'outline' : 'default'} size="sm" onClick={() => handleClick(target)} disabled={transitionMutation.isPending}>
              <ArrowRight className="h-4 w-4 mr-2" />
              {isRegression ? `${lang('nonconformity.returnTo')} ` : `${lang('nonconformity.moveTo')} `}{NC_STATUS_LABELS[target]}
            </Button>
          );
        })}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('nonconformity.confirmTransition')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('nonconformity.transitionDescription', { from: NC_STATUS_LABELS[nc.status], to: selectedTransition ? NC_STATUS_LABELS[selectedTransition] : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {validationError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>{lang('nonconformity.warning')}:</strong> {validationError}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nc-reason">{lang('nonconformity.reasonOptional')}</Label>
            <Textarea id="nc-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={lang('nonconformity.reasonPlaceholder')} />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{lang('nonconformity.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={transitionMutation.isPending}>
              {transitionMutation.isPending ? lang('nonconformity.processing') : lang('nonconformity.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
