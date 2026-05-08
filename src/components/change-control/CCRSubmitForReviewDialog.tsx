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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useCompanyUsers, type CompanyUser } from '@/hooks/useCompanyUsers';
import {
  CCR_PERSPECTIVE_LABELS,
  CCR_PERSPECTIVE_DESCRIPTIONS,
  CCR_PERSPECTIVE_ORDER,
  type CCRPerspective,
} from '@/types/changeControl';

export interface CCRReviewerRowPayload {
  user_id: string;
  perspectives: CCRPerspective[];
}

export interface CCRSubmitForReviewPayload {
  reason: string;
  reviewers: CCRReviewerRowPayload[];
}

interface InitialReviewer {
  user_id: string;
  perspectives: CCRPerspective[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  initial?: InitialReviewer[];
  suggestedPerspectives?: CCRPerspective[];
  onConfirm: (payload: CCRSubmitForReviewPayload) => Promise<void> | void;
}

type Row = { user_id: string; perspectives: CCRPerspective[] };

export function CCRSubmitForReviewDialog({
  open,
  onOpenChange,
  companyId,
  initial,
  suggestedPerspectives = [],
  onConfirm,
}: Props) {
  const { users, isLoading } = useCompanyUsers(companyId);
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setRows(
        initial && initial.length > 0
          ? initial.map((r) => ({ user_id: r.user_id, perspectives: [...r.perspectives] }))
          : [{ user_id: '', perspectives: [] }],
      );
    }
  }, [open, initial]);

  const ready = useMemo(() => {
    if (reason.trim().length === 0) return false;
    if (rows.length === 0) return false;
    if (rows.some((r) => !r.user_id || r.perspectives.length === 0)) return false;
    const ids = rows.map((r) => r.user_id);
    if (new Set(ids).size !== ids.length) return false;
    return true;
  }, [reason, rows]);

  const handleConfirm = async () => {
    if (!ready) return;
    setSubmitting(true);
    try {
      await onConfirm({
        reason: reason.trim(),
        reviewers: rows.map((r) => ({ user_id: r.user_id, perspectives: r.perspectives })),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };
  const addRow = () => setRows((prev) => [...prev, { user_id: '', perspectives: [] }]);

  const togglePerspective = (idx: number, p: CCRPerspective) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const has = r.perspectives.includes(p);
        return {
          ...r,
          perspectives: has ? r.perspectives.filter((x) => x !== p) : [...r.perspectives, p],
        };
      }),
    );
  };

  const usedUserIds = new Set(rows.map((r) => r.user_id).filter(Boolean));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit CCR for Review</DialogTitle>
          <DialogDescription>
            Add one or more reviewers and choose which perspectives each will sign off through.
            The same person can cover several perspectives — useful for small teams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Reviewers <span className="text-destructive">*</span></Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" /> Add Reviewer
              </Button>
            </div>

            <div className="space-y-2">
              {rows.map((row, idx) => {
                const availableUsers = users.filter(
                  (u: CompanyUser) => u.id === row.user_id || !usedUserIds.has(u.id),
                );
                return (
                  <div key={idx} className="flex items-start gap-2 p-2 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <Select
                        value={row.user_id}
                        onValueChange={(v) => updateRow(idx, { user_id: v })}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoading ? 'Loading…' : 'Select person'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.length === 0 && !isLoading ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No users available
                            </div>
                          ) : (
                            availableUsers.map((u: CompanyUser) => (
                              <SelectItem key={u.id} value={u.id}>
                                <span className="font-medium">{u.name}</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 min-w-0">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            <span className="truncate text-left flex-1 min-w-0">
                              {row.perspectives.length === 0 ? (
                                <span className="text-muted-foreground">Select perspectives…</span>
                              ) : row.perspectives.length <= 2 ? (
                                row.perspectives.map((p) => CCR_PERSPECTIVE_LABELS[p]).join(', ')
                              ) : (
                                `${CCR_PERSPECTIVE_LABELS[row.perspectives[0]]} +${row.perspectives.length - 1} more`
                              )}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-1" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="start">
                          <div className="space-y-1 max-h-72 overflow-auto">
                            {CCR_PERSPECTIVE_ORDER.map((p) => {
                              const checked = row.perspectives.includes(p);
                              return (
                                <label
                                  key={p}
                                  className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => togglePerspective(idx, p)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight">
                                      {CCR_PERSPECTIVE_LABELS[p]}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {CCR_PERSPECTIVE_DESCRIPTIONS[p]}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {suggestedPerspectives.length > 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap pt-1">
                <span>Suggested for this change:</span>
                {suggestedPerspectives.map((p) => (
                  <Badge key={p} variant="secondary" className="font-normal">
                    {CCR_PERSPECTIVE_LABELS[p]}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccr-submit-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ccr-submit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Captured for the audit trail (ISO 13485 §4.2.5)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!ready || submitting}>
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}