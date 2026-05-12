import React, { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { decorateLinkedDoc, type LinkedCCRDoc } from '@/services/ccrLinkedDocsService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All linked documents that are NOT yet Approved — the candidates an
   *  exemption can cover. */
  unapprovedDocs: LinkedCCRDoc[];
  totalDocCount: number;
  onConfirm: (input: { documentIds: string[]; notes: string }) => Promise<void> | void;
}

export function CCRExemptionRequestDialog({
  open,
  onOpenChange,
  unapprovedDocs,
  totalDocCount,
  onConfirm,
}: Props) {
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes('');
      // Default to all currently-unapproved docs selected — that's the
      // common case and saves a click; the author can deselect to scope down.
      setSelected(unapprovedDocs.map((d) => d.id));
      setSubmitting(false);
    }
  }, [open, unapprovedDocs]);

  const ready = selected.length > 0;
  const pendingCount = unapprovedDocs.length;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allChecked = useMemo(
    () => unapprovedDocs.length > 0 && selected.length === unapprovedDocs.length,
    [selected, unapprovedDocs],
  );

  const toggleAll = () => {
    setSelected(allChecked ? [] : unapprovedDocs.map((d) => d.id));
  };

  const handleConfirm = async () => {
    if (!ready) return;
    setSubmitting(true);
    try {
      await onConfirm({ documentIds: selected, notes: notes.trim() });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Implementation Exemption</DialogTitle>
          <DialogDescription>
            {pendingCount} of {totalDocCount} connected document
            {totalDocCount === 1 ? ' is' : 's are'} not yet approved. Pick the
            ones a company admin should grant a one-time exemption for, so{' '}
            <span className="font-medium">Mark Implemented</span> can proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Documents to exempt <span className="text-destructive">*</span>
              </Label>
              {unapprovedDocs.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="h-7" onClick={toggleAll}>
                  {allChecked ? 'Clear all' : 'Select all'}
                </Button>
              )}
            </div>

            {unapprovedDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No un-approved documents to exempt.
              </p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-auto rounded-md border p-1">
                {unapprovedDocs.map((d) => {
                  const checked = selected.includes(d.id);
                  const status = (d.status || 'Draft').replace(/_/g, ' ');
                  const { displayRef, displayTitle } = decorateLinkedDoc(d);
                  return (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(d.id)}
                        className="shrink-0"
                      />
                      {displayRef && (
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted border shrink-0">
                          {displayRef}
                        </span>
                      )}
                      <p
                        className="text-sm font-medium truncate flex-1 min-w-0 max-w-[260px]"
                        title={displayTitle}
                      >
                        {displayTitle}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 h-4 capitalize shrink-0"
                      >
                        {status}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccr-exemption-notes">Notes</Label>
            <Textarea
              id="ccr-exemption-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context for the admin — e.g. WI-QA-004-1 is in final review with the Quality Lead; cannot wait without delaying the change."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!ready || submitting}>
            {submitting ? 'Sending…' : 'Send to Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
