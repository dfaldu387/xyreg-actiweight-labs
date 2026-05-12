import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, XCircle } from 'lucide-react';
import { decorateLinkedDoc, type LinkedCCRDoc } from '@/services/ccrLinkedDocsService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The author's notes / rationale for the exemption. */
  notes: string | null;
  /** Documents the author asked to exempt (resolved metadata). */
  exemptedDocs: LinkedCCRDoc[];
  /** Display name of the requester — shown for context. */
  requestedByName?: string | null;
  /** When the exemption was raised. */
  requestedAtISO?: string | null;
  pendingDocCount: number;
  totalDocCount: number;
  onConfirm: (decision: 'approved' | 'rejected', reason: string) => Promise<void> | void;
}

export function CCRExemptionReviewDialog({
  open,
  onOpenChange,
  notes,
  exemptedDocs,
  requestedByName,
  requestedAtISO,
  pendingDocCount,
  totalDocCount,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState<null | 'approved' | 'rejected'>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setSubmitting(null);
    }
  }, [open]);

  const ready = reason.trim().length > 0;

  const handle = async (decision: 'approved' | 'rejected') => {
    if (!ready) return;
    setSubmitting(decision);
    try {
      await onConfirm(decision, reason.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  };

  const requestedAtFormatted = (() => {
    if (!requestedAtISO) return null;
    const d = new Date(requestedAtISO);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (submitting === null) onOpenChange(o); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Review Exemption Request</DialogTitle>
          <DialogDescription>
            Approving unlocks <span className="font-medium">Mark Implemented</span> for the
            documents listed below
            {pendingDocCount > exemptedDocs.length && (
              <>. Other un-approved documents ({pendingDocCount - exemptedDocs.length}) keep the gate locked</>
            )}
            . Your decision is captured in the audit trail.
            {totalDocCount > 0 && pendingDocCount > 0 && (
              <>
                {' '}({pendingDocCount} of {totalDocCount} connected document
                {totalDocCount === 1 ? ' is' : 's are'} pending overall.)
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/40 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Requested by{' '}
                <span className="font-medium text-foreground">
                  {requestedByName || 'Author'}
                </span>
              </span>
              {requestedAtFormatted && <span>{requestedAtFormatted}</span>}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Documents to exempt ({exemptedDocs.length})
              </p>
              {exemptedDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  None specified.
                </p>
              ) : (
                <ul className="space-y-1">
                  {exemptedDocs.map((d) => {
                    const status = (d.status || 'Draft').replace(/_/g, ' ');
                    const { displayRef, displayTitle } = decorateLinkedDoc(d);
                    return (
                      <li
                        key={d.id}
                        className="flex items-center gap-2 rounded border bg-background px-2 py-1.5"
                      >
                        {displayRef && (
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted border shrink-0">
                            {displayRef}
                          </span>
                        )}
                        <span
                          className="text-sm font-medium truncate flex-1 min-w-0 max-w-[300px]"
                          title={displayTitle}
                        >
                          {displayTitle}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 h-4 capitalize shrink-0">
                          {status}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes from author</p>
              <p className="whitespace-pre-wrap text-sm">
                {notes && notes.trim().length > 0
                  ? notes
                  : <span className="text-muted-foreground italic">No notes provided.</span>}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccr-exemption-review-reason">
              Decision reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ccr-exemption-review-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief rationale — captured for ISO 13485 §4.2.5 audit."
              rows={4}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting !== null}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            disabled={!ready || submitting !== null}
            onClick={() => handle('rejected')}
          >
            <XCircle className="h-4 w-4 mr-1" />
            {submitting === 'rejected' ? 'Rejecting…' : 'Reject'}
          </Button>
          <Button disabled={!ready || submitting !== null} onClick={() => handle('approved')}>
            <Check className="h-4 w-4 mr-1" />
            {submitting === 'approved' ? 'Approving…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
